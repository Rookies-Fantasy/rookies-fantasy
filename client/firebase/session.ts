import { FirebaseAuthTypes, getIdToken } from "@react-native-firebase/auth";
import { getBackendMode } from "./config";
import { CaughtError } from "@/types/error";
import { getErrorCode, NETWORK_ERROR_CODE } from "@/utils/errorCodes";

/**
 * Force-refreshes the ID token so a session cached from a wiped emulator signs
 * out instead of restoring a user that no longer exists.
 *
 * Only a network failure counts as "emulator unreachable" and is rethrown; any
 * other failure means a dead session. A fixed list of "invalid session" codes
 * isn't enough: iOS has no mapping for the emulator's `INVALID_REFRESH_TOKEN`
 * and reports a deleted or disabled user as `auth/internal-error`.
 */
export const validateEmulatorSession = async (
  user: FirebaseAuthTypes.User,
): Promise<boolean> => {
  if (getBackendMode() !== "emulator") return true;

  return getIdToken(user, true).then(
    () => true,
    (error: CaughtError) => {
      if (getErrorCode(error) === NETWORK_ERROR_CODE) throw error;
      return false;
    },
  );
};
