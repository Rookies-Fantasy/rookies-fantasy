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

const AuthListener = ({ children }: AuthListenerProps) => {
  const [initializing, setInitializing] = useState(true);
  const auth = getAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;

    const subscriber = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userData = await UserController.getUser(user.uid);
          dispatch(setUser(userData));

          // Subscribe to real-time user updates
          userUnsubscribe = UserController.subscribeToUser(
            user.uid,
            (updatedUser) => {
              if (updatedUser) {
                dispatch(setUser(updatedUser));
              }
            },
          );

          const teams = await UserController.getUserTeams(user.uid);
          if (teams?.length > 0) {
            let firstTeamId: string;
            firstTeamId = teams[0].id;
            const teamData = await UserController.getUserTeam(
              user.uid,
              firstTeamId,
            );
            dispatch(setTeam(teamData));
          }

          const matchupData = await MatchupController.getUserMatchup(user.uid);
          if (matchupData) {
            dispatch(setMatchup(matchupData));
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
