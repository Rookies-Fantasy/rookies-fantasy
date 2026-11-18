import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "@react-native-firebase/auth";
import * as SplashScreen from "expo-splash-screen";
import { useState, useEffect, ReactNode } from "react";
import StartupError from "./StartupError";
import { MatchupController } from "@/controllers/matchupController";
import { UserController } from "@/controllers/userController";
import { validateEmulatorSession } from "@/firebase/session";
import { useAppDispatch } from "@/state/hooks";
import { clearCurrentLeague } from "@/state/slices/leagueSlice";
import { setMatchup, clearMatchup } from "@/state/slices/matchupSlice";
import { setTeam, clearTeam } from "@/state/slices/teamSlice";
import { setUser, clearUser } from "@/state/slices/userSlice";

type AuthListenerProps = {
  children: ReactNode;
};

const AuthListener = ({ children }: AuthListenerProps) => {
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "retrying"
  >("loading");
  const [retryCount, setRetryCount] = useState(0);
  const auth = getAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;
    let cancelSession: (() => void) | undefined;

    const clearSession = () => {
      dispatch(clearUser());
      dispatch(clearTeam());
      dispatch(clearMatchup());
      dispatch(clearCurrentLeague());
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      cancelSession?.();

      // Each Auth event replaces the previous session's work and subscription.
      let cancelled = false;
      let userUnsubscribe: (() => void) | null = null;
      cancelSession = () => {
        cancelled = true;
        userUnsubscribe?.();
        userUnsubscribe = null;
      };

      if (!user) {
        clearSession();
        setStatus("ready");
        return;
      }

      try {
        const valid = await validateEmulatorSession(user);
        if (cancelled) return;

        if (!valid) {
          clearSession();
          await signOut(auth);
          if (!cancelled) setStatus("ready");
          return;
        }
      } catch (error: unknown) {
        if (!cancelled) {
          console.error("Error restoring emulator session:", error);
          setStatus("error");
        }
        return;
      }

      try {
        const userData = await UserController.getUser(user.uid);
        if (cancelled) return;
        dispatch(setUser(userData));

        // Subscribe to real-time user updates
        userUnsubscribe = UserController.subscribeToUser(
          user.uid,
          async (updatedUser) => {
            if (cancelled) return;
            if (updatedUser) {
              dispatch(setUser(updatedUser));

              if (updatedUser.queueStatus === "matched") {
                try {
                  const matchupData = await MatchupController.getUserMatchup(
                    user.uid,
                  );
                  if (!cancelled && matchupData) {
                    dispatch(setMatchup(matchupData));
                  }
                } catch (error) {
                  console.error("Error fetching matchup:", error);
                }
              }
            }
          },
        );

        const teams = await UserController.getUserTeams(user.uid);
        if (cancelled) return;
        if (teams?.length > 0) {
          const rankedTeam = teams.find((team) => !team.isLeagueTeam);
          if (rankedTeam) {
            const teamData = await UserController.getUserTeam(
              user.uid,
              rankedTeam.id,
            );
            if (cancelled) return;
            dispatch(setTeam(teamData));
          }
        }
      } catch (error) {
        if (!cancelled) console.error("Error fetching user document:", error);
      }
      if (!cancelled) setStatus("ready");
    });

    return () => {
      active = false;
      unsubscribeAuth();
      cancelSession?.();
    };
  }, [auth, dispatch, retryCount]);

  useEffect(() => {
    if (status === "ready" || status === "error") SplashScreen.hide();
  }, [status]);

  if (status === "loading") return null;
  if (status === "error" || status === "retrying") {
    return (
      <StartupError
        isLoading={status === "retrying"}
        message="Check that the emulators are running and your device can reach them, then try again."
        onRetry={() => {
          setStatus("retrying");
          setRetryCount((previous) => previous + 1);
        }}
        title="Unable to restore your session"
      />
    );
  }

  return children;
};

export default AuthListener;
