import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  setUser,
  CurrentUser,
  clearUser,
  selectCurrentUserId,
} from "@/state/slices/userSlice";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

type Props = {
  children: React.ReactNode;
};

export default function AuthListener({ children }: Props) {
  const [initializing, setInitializing] = useState(true);
  const auth = getAuth();
  const router = useRouter();
  const isSignedIn = useAppSelector(selectCurrentUserId);
  const dispatch = useAppDispatch();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await firestore()
            .collection("users")
            .doc(user.uid)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data();

            if (userData?.createdAt instanceof firestore.Timestamp) {
              userData.createdAt = userData.createdAt.toDate().toISOString(); // Convert to string
            }

            if (userData?.updatedAt instanceof firestore.Timestamp) {
              userData.updatedAt = userData.updatedAt.toDate().toISOString(); // Convert to string
            }

            dispatch(setUser(userData as CurrentUser));
          } else {
            console.log("No user document found in Firestore");
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

  useEffect(() => {
    if (!initializing && appReady) {
      // Now safe to navigate
      if (isSignedIn) {
        router.push("/(app)/(tabs)");
      } else {
        router.push("/(auth)");
      }
    }
  }, [initializing, appReady, isSignedIn, router]);

  useEffect(() => {
    setAppReady(true);
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
