import auth, {
  FirebaseAuthTypes,
  getIdToken,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

// Codes that mean the account behind a cached session is gone or barred. Every
// other failure (notably auth/network-request-failed) leaves the session intact
// so the app still opens offline.
const REVOKED_SESSION_CODES = [
  "auth/user-not-found",
  "auth/user-token-expired",
  "auth/user-disabled",
  "auth/invalid-user-token",
];

const getErrorCode = (error: Error): string =>
  "code" in error ? String(error.code) : "";

/**
 * Forces an ID token refresh to confirm the cached session still maps to a live
 * account. React Native Firebase persists sessions in native storage (Android
 * SharedPreferences, iOS Keychain), so a deleted or disabled user — or a wiped
 * auth emulator — keeps working off the ~1h cached token until something forces
 * a refresh. Returns true when the session is still good, or when the check
 * failed for a reason unrelated to the account (e.g. no network).
 */
export const hasLiveSession = async (
  user: FirebaseAuthTypes.User,
): Promise<boolean> => {
  try {
    await getIdToken(user, true);
    return true;
  } catch (error) {
    if (!(error instanceof Error)) {
      return true;
    }
    return !REVOKED_SESSION_CODES.includes(getErrorCode(error));
  }
};

export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const signInResult = await GoogleSignin.signIn();

    const idToken = signInResult.data?.idToken;

    if (!idToken) {
      throw new Error("No ID token found");
    }

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    return auth().signInWithCredential(googleCredential);
  } catch (error) {
    console.log("Google Sign-In Error:", error);
    throw error;
  }
};
