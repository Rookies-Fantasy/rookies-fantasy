import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "@react-native-firebase/auth";
import { useState, useEffect, ReactNode } from "react";
import { View } from "react-native";
import Spinner from "./Spinner";
import { MatchupController } from "@/controllers/matchupController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setMatchup, clearMatchup } from "@/state/slices/matchupSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { setUser, clearUser } from "@/state/slices/userSlice";
import { hasLiveSession } from "@/utils/authUtils";

type AuthListenerProps = {
  children: ReactNode;
};

const AuthListener = ({ children }: AuthListenerProps) => {
  const [initializing, setInitializing] = useState(true);
  const auth = getAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;

    const clearSession = () => {
      dispatch(clearUser());
      dispatch(clearMatchup());
      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
      }
    };

    const subscriber = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearSession();
        setInitializing(false);
        return;
      }

      // A cached session outlives the account it points at, so verify it before
      // letting the route guards treat the user as signed in.
      if (!(await hasLiveSession(user))) {
        clearSession();
        try {
          await signOut(auth);
        } catch (error) {
          console.error("Error signing out revoked session:", error);
        }
        setInitializing(false);
        return;
      }

      try {
        const userData = await UserController.getUser(user.uid);
        dispatch(setUser(userData));

        // Subscribe to real-time user updates
        userUnsubscribe = UserController.subscribeToUser(
          user.uid,
          async (updatedUser) => {
            if (updatedUser) {
              dispatch(setUser(updatedUser));

              if (updatedUser.queueStatus === "matched") {
                try {
                  const matchupData = await MatchupController.getUserMatchup(
                    user.uid,
                  );
                  if (matchupData) {
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
        if (teams?.length > 0) {
          const rankedTeam = teams.find((team) => !team.isLeagueTeam);
          if (rankedTeam) {
            const teamData = await UserController.getUserTeam(
              user.uid,
              rankedTeam.id,
            );
            dispatch(setTeam(teamData));
          }
        }
      } catch (error) {
        console.error("Error fetching user document:", error);
      }
      setInitializing(false);
    });

    return () => {
      subscriber();
      if (userUnsubscribe) {
        userUnsubscribe();
      }
    };
  }, [auth, dispatch]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  return children;
};

export default AuthListener;
