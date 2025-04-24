import { useAppDispatch } from "@/state/hooks";
import { CurrentUser, setUser, setLoading } from "@/state/slices/userSlice";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";
import { createContext, useContext, useEffect } from "react";

// User Context: Used for managing auth state
const AuthContext = createContext<{
  user: CurrentUser | null;
  loading: boolean;
}>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const auth = getAuth();
    dispatch(setLoading(true));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const db = getFirestore();
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          const userData = docSnap.data();

          if (userData) {
            const currentUser = {
              isLoading: false,
              userId: user.uid,
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

  return (
    <AuthContext.Provider value={{ loading: true, user: null }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
