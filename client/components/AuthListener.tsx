import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
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
          dispatch(
            setUser({
              avatarUrl: userData?.avatarUrl,
              dateOfBirth: userData?.dateOfBirth?.toDate().toISOString(),
              email: userData?.email,
              id: user.uid,
              username: userData?.username,
            }),
          );
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
};

export default AuthListener;
