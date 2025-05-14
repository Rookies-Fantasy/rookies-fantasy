import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAppDispatch } from "@/state/hooks";
import {
  setUser,
  CurrentUser,
  clearUser,
  setIsLoading,
} from "@/state/slices/userSlice";

type Props = {
  children: React.ReactNode;
};

const AuthListener = ({ children }: Props) => {
  const [initializing, setInitializing] = useState(true);
  const auth = getAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (user) => {
      dispatch(setIsLoading(true));
      if (user) {
        try {
          const userRef = firestore().collection("users").doc(user.uid);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            const userData = userDoc.data();

            if (userData?.createdAt instanceof firestore.Timestamp) {
              userData.createdAt = userData.createdAt.toDate().toISOString();
            }

            if (userData?.updatedAt instanceof firestore.Timestamp) {
              userData.updatedAt = userData.updatedAt.toDate().toISOString();
            }

            dispatch(setUser(userData as CurrentUser));
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
        }
      } else {
        dispatch(clearUser());
      }

      dispatch(setIsLoading(false));
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
