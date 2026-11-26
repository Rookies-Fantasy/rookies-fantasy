import auth from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useAppDispatch } from "@/state/hooks";
import { clearCurrentLeague } from "@/state/slices/leagueSlice";
import { clearMatchup } from "@/state/slices/matchupSlice";
import { clearTeam } from "@/state/slices/teamSlice";
import { clearUser } from "@/state/slices/userSlice";

/**
 * Session teardown shared by log out and account deletion.
 * - `clearSessionAndExit`: clears Redux session state and returns to auth.
 * - `signOut`: signs out of Firebase, then clears state and returns to auth.
 */
export const useSignOut = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const clearSessionAndExit = useCallback(() => {
    dispatch(clearUser());
    dispatch(clearTeam());
    dispatch(clearMatchup());
    dispatch(clearCurrentLeague());
    router.replace("/(auth)");
  }, [dispatch, router]);

  const signOut = useCallback(async () => {
    await auth().signOut();
    clearSessionAndExit();
  }, [clearSessionAndExit]);

  return { signOut, clearSessionAndExit };
};
