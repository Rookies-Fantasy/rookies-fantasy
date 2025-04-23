import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { setLoading, setUser } from "../state/slices/userSlice";

export const useAuthState = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const auth = getAuth();
    dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await firestore()
            .collection("users")
            .doc(user.uid)
            .get();
          const userData = userDoc.data();

          if (userData) {
            const currentUser = {
              isLoading: false,
              uid: user.uid,
              username: userData.username || "",
              email: user.email || "",
              displayName: user.displayName || "",
              dob: userData.dob || "",
              avatar: userData.avatar || user.photoURL || "",
            };

            dispatch(setUser(currentUser));
          } else {
            console.error("User data not found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore", error);
        }
      } else {
        dispatch(setUser({ isLoading: false })); // Set user to null when not authenticated
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return null;
};
