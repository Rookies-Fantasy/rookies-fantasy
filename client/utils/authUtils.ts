import { appleAuth } from "@invertase/react-native-apple-authentication";
import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isCancelledResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { LoginProvider } from "@/types/providers";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
});

const NETWORK_ERROR_CODE = "auth/network-request-failed";
const ACCOUNT_EXISTS_ERROR_CODE =
  "auth/account-exists-with-different-credential";

const GOOGLE_SILENT_ERROR_CODES = new Set([
  statusCodes.SIGN_IN_CANCELLED,
  statusCodes.IN_PROGRESS,
]);

/**
 * Reads the `code` from a caught Firebase, Apple, or Google sign-in error.
 * Takes `unknown` on purpose: it is the type of a `catch` binding.
 * Returns an empty string when the error has no string code.
 */
export const getAuthErrorCode = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return "";
};

const getAppleSignInErrorMessage = (code: string): string => {
  switch (code) {
    case appleAuth.Error.UNKNOWN:
      return "We couldn't sign you in with Apple. Make sure you're signed in to your Apple Account in Settings, then try again.";
    case ACCOUNT_EXISTS_ERROR_CODE:
      return "An account already exists with this email. Sign in with Google or your email and password instead.";
    case NETWORK_ERROR_CODE:
      return "We couldn't reach the server. Check your internet connection and try again.";
    default:
      return "We couldn't sign you in with Apple. Please try again.";
  }
};

const getGoogleSignInErrorMessage = (code: string): string => {
  switch (code) {
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return "Google Play Services is unavailable or out of date on this device. Update it, then try again.";
    case ACCOUNT_EXISTS_ERROR_CODE:
      return "An account already exists with this email. Sign in with Apple or your email and password instead.";
    case NETWORK_ERROR_CODE:
      return "We couldn't reach the server. Check your internet connection and try again.";
    default:
      return "We couldn't sign you in with Google. Please try again.";
  }
};

/** Picks the alert message for a failed SSO sign-in from its error code. */
export const getSsoErrorMessage = (
  provider: LoginProvider,
  code: string,
): string =>
  provider === LoginProvider.Apple
    ? getAppleSignInErrorMessage(code)
    : getGoogleSignInErrorMessage(code);

/** Returns `null` if the user dismissed the Google sign-in sheet. */
const getGoogleCredential = async () => {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();

  if (isCancelledResponse(signInResult)) {
    return null;
  }

  const idToken = signInResult.data?.idToken;

  if (!idToken) {
    throw new Error("No ID token found");
  }

  return auth.GoogleAuthProvider.credential(idToken);
};

export const getAppleCredential = async () => {
  const { identityToken, nonce } = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL],
  });

  if (!identityToken) {
    throw new Error("Apple Sign-In failed - no identity token returned");
  }

  return auth.AppleAuthProvider.credential(identityToken, nonce);
};

export const isAppleSignInSupported = appleAuth.isSupported;

/** Returns `null` if the user dismissed the Google sign-in sheet. */
export const signInWithGoogle = async () => {
  try {
    const googleCredential = await getGoogleCredential();
    if (googleCredential === null) {
      return null;
    }
    return await auth().signInWithCredential(googleCredential);
  } catch (error) {
    if (GOOGLE_SILENT_ERROR_CODES.has(getAuthErrorCode(error))) {
      return null;
    }
    console.log("Google Sign-In Error:", error);
    throw error;
  }
};

/** Returns `null` if the user dismissed the Apple sign-in sheet. */
export const signInWithApple = async () => {
  try {
    const appleCredential = await getAppleCredential();
    return await auth().signInWithCredential(appleCredential);
  } catch (error) {
    if (getAuthErrorCode(error) === appleAuth.Error.CANCELED) {
      return null;
    }
    console.log("Apple Sign-In Error:", error);
    throw error;
  }
};
