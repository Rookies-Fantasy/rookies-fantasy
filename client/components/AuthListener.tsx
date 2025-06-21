import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useState, useEffect, ReactNode } from "react";
import { View } from "react-native";
import Spinner from "./Spinner";
import { useAppDispatch } from "@/state/hooks";
import { setUser, clearUser } from "@/state/slices/userSlice";
import { CurrentUser } from "@/types/userTypes";

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
          const userRef = firestore().collection("users").doc(user.uid);
          const userDoc = await userRef.get();

          if (userDoc.exists()) {
            const userData = userDoc.data();

            if (userData?.createdAt instanceof firestore.Timestamp) {
              userData.createdAt = userData.createdAt.toDate().toISOString();
            }

            if (userData?.updatedAt instanceof firestore.Timestamp) {
              userData.updatedAt = userData.updatedAt.toDate().toISOString();
            }

            if (userData?.dateOfBirth instanceof firestore.Timestamp) {
              userData.dateOfBirth = userData.dateOfBirth
                .toDate()
                .toISOString();
            }

            dispatch(setUser(userData as CurrentUser));
          }
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
