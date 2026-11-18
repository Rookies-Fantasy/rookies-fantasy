import { FirebaseAuthTypes, getIdToken } from "@react-native-firebase/auth";
import { getBackendMode } from "./config";

const INVALID_SESSION_CODES = new Set([
  "auth/user-not-found",
  "auth/user-disabled",
  "auth/user-token-expired",
  "auth/invalid-user-token",
]);

export const validateEmulatorSession = async (
  user: FirebaseAuthTypes.User,
): Promise<boolean> => {
  if (getBackendMode() !== "emulator") return true;

  try {
    // A cached token can outlive a wiped emulator. Ask Auth for a fresh one.
    await getIdToken(user, true);
    return true;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string" &&
      INVALID_SESSION_CODES.has(error.code)
    ) {
      return false;
    }

    // A connection failure cannot tell us whether the account still exists.
    throw error;
  }
};
