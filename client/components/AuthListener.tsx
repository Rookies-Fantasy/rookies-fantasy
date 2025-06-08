import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import Spinner from "./Spinner";
import { useState, useEffect, ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import { UserController } from "@/controllers/userController";
import { useAppDispatch } from "@/state/hooks";
import { setUser, clearUser } from "@/state/slices/userSlice";

type AuthListenerProps = {
  children: ReactNode;
};

const AuthListener = ({ children }: AuthListenerProps) => {
  const [initializing, setInitializing] = useState(true);
  const auth = getAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userData = await UserController.getUser(user.uid);
          dispatch(setUser(userData));
        } catch (error) {
          console.error("Error fetching user document:", error);
        }
      } else {
        dispatch(clearUser());
      }

      setInitializing(false);
    });

    return subscriber;
  }, [auth, dispatch]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  return <>{children}</>;
};

export default AuthListener;
