import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { useState, useEffect, ReactNode } from "react";
import { View } from "react-native";
import Spinner from "./Spinner";
import { MatchupController } from "@/controllers/matchupController";
import { UserController } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setMatchup, clearMatchup } from "@/state/slices/matchupSlice";
import { setTeam } from "@/state/slices/teamSlice";
import { setUser, clearUser } from "@/state/slices/userSlice";

type AuthListenerProps = {
  children: ReactNode;
};

const FIREBASE_ENVIRONMENT_KEY = "firebase-environment";

const AuthListener = ({ children }: AuthListenerProps) => {
  const [initializing, setInitializing] = useState(true);
  const auth = getAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;
    let environmentChecked = false;

    const subscriber = onAuthStateChanged(auth, async (user) => {
      if (!environmentChecked) {
        environmentChecked = true;
        const currentEnvironment =
          process.env.EXPO_PUBLIC_USE_EMULATOR === "true"
            ? "emulator"
            : "firebase";
        const previousEnvironment = await AsyncStorage.getItem(
          FIREBASE_ENVIRONMENT_KEY,
        );

        await AsyncStorage.setItem(
          FIREBASE_ENVIRONMENT_KEY,
          currentEnvironment,
        );

        // A persisted session from another Firebase environment is not valid
        // for this one because the environments have different Auth users.
        if (user && previousEnvironment !== currentEnvironment) {
          await auth.signOut();
          return;
        }
      }

      if (user) {
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
      } else {
        dispatch(clearUser());
        dispatch(clearMatchup());
        if (userUnsubscribe) {
          userUnsubscribe();
          userUnsubscribe = null;
        }
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
