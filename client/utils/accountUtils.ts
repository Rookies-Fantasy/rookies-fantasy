import { appleAuth } from "@invertase/react-native-apple-authentication";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isCancelledResponse,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

// NOTE: The Apple/Google credential code below overlaps with authUtils.ts.
// It lives here to stay conflict-free with the Sign in with Apple PR and can be
// consolidated into shared credential helpers once that PR merges.

type ReauthProviderId = "apple.com" | "google.com" | "password";

// Order matters: if a user has several linked providers, prefer the SSO ones
// so password users who also linked Google/Apple aren't asked for a password.
const REAUTH_PROVIDER_PRIORITY: ReauthProviderId[] = [
  "apple.com",
  "google.com",
  "password",
];

/** Thrown when the user backs out of a re-authentication prompt. */
export class AccountDeletionCancelledError extends Error {
  constructor() {
    super("Account deletion was cancelled");
    this.name = "AccountDeletionCancelledError";
  }
}

const getReauthProviderId = (
  user: FirebaseAuthTypes.User,
): ReauthProviderId | null => {
  const providerIds = user.providerData.map((info) => info.providerId);
  return (
    REAUTH_PROVIDER_PRIORITY.find((providerId) =>
      providerIds.includes(providerId),
    ) ?? null
  );
};

/** True when the current user must re-enter their password to delete. */
export const isPasswordUser = (): boolean => {
  const user = auth().currentUser;
  return user !== null && getReauthProviderId(user) === "password";
};

const reauthenticateWithApple = async (user: FirebaseAuthTypes.User) => {
  if (Platform.OS !== "ios" || !appleAuth.isSupported) {
    throw new Error(
      "Please use an iOS device to delete an account created with Apple.",
    );
  }

  let response;
  try {
    response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });
  } catch (error) {
    if (getErrorCode(error) === appleAuth.Error.CANCELED) {
      throw new AccountDeletionCancelledError();
    }
    throw error;
  }

  const { identityToken, nonce, authorizationCode } = response;
  if (!identityToken) {
    throw new Error("Apple re-authentication failed: no identity token");
  }

  await user.reauthenticateWithCredential(
    auth.AppleAuthProvider.credential(identityToken, nonce),
  );

  // Apple requires revoking the user's tokens when their account is deleted.
  if (authorizationCode) {
    await auth().revokeToken(authorizationCode);
  }
};

const reauthenticateWithGoogle = async (user: FirebaseAuthTypes.User) => {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
  });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (isCancelledResponse(response)) {
    throw new AccountDeletionCancelledError();
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error("Google re-authentication failed: no ID token");
  }

  await user.reauthenticateWithCredential(
    auth.GoogleAuthProvider.credential(idToken),
  );
};

const reauthenticateWithPassword = async (
  user: FirebaseAuthTypes.User,
  password: string,
) => {
  if (!user.email || !password) {
    throw new Error("Password is required to delete your account.");
  }

  await user.reauthenticateWithCredential(
    auth.EmailAuthProvider.credential(user.email, password),
  );
};

/**
 * Permanently deletes the signed-in user's account.
 *
 * Re-authenticates first so `user.delete()` never fails with
 * `auth/requires-recent-login`. Firestore cleanup (profile, teams, league
 * memberships) is handled by the `deleteUserData` auth trigger on the server.
 *
 * @param password Required only for email/password accounts.
 * @throws AccountDeletionCancelledError if the user cancels an SSO prompt.
 */
export const deleteAccount = async (password: string = "") => {
  const user = auth().currentUser;
  if (!user) {
    throw new Error("No signed-in user to delete.");
  }

  const providerId = getReauthProviderId(user);

  switch (providerId) {
    case "apple.com":
      await reauthenticateWithApple(user);
      break;
    case "google.com":
      await reauthenticateWithGoogle(user);
      break;
    case "password":
      await reauthenticateWithPassword(user, password);
      break;
    default:
      // Unknown provider: attempt deletion without re-auth; a stale session
      // surfaces as auth/requires-recent-login and is handled by the caller.
      break;
  }

  await user.delete();

  if (providerId === "google.com") {
    await GoogleSignin.signOut().catch(() => null);
  }
};

// `unknown` is intentional: caught errors are untyped at the boundary.
const getErrorCode = (error: unknown): string =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string"
    ? error.code
    : "";

// Auth errors the user can resolve themselves (e.g. a mistyped password).
// These are shown in an alert and are not logged as errors.
const EXPECTED_DELETION_ERROR_CODES = [
  "auth/wrong-password",
  "auth/invalid-credential",
  "auth/too-many-requests",
  "auth/requires-recent-login",
  "auth/network-request-failed",
  "auth/user-mismatch",
];

/** True when a deleteAccount error is a known, user-recoverable auth error. */
export const isExpectedAccountDeletionError = (error: unknown): boolean =>
  EXPECTED_DELETION_ERROR_CODES.includes(getErrorCode(error));

/**
 * Maps a deleteAccount error to a user-facing message.
 * Returns null when the error was a user cancellation and should be ignored.
 */
export const getAccountDeletionErrorMessage = (
  error: unknown,
): string | null => {
  if (error instanceof AccountDeletionCancelledError) {
    return null;
  }

  switch (getErrorCode(error)) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "That password is incorrect. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/requires-recent-login":
      return "For your security, please log out, log back in, and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/user-mismatch":
      return "Please sign in with the same account you're trying to delete.";
    default:
      return error instanceof Error && error.message
        ? error.message
        : "Something went wrong deleting your account. Please try again.";
  }
};
