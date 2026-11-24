import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FirebaseAuthTypes, getIdToken } from "@react-native-firebase/auth";
import { getBackendMode } from "../config";
import { validateEmulatorSession } from "../session";

jest.mock("@react-native-firebase/auth", () => ({
  getIdToken: jest.fn(),
}));

jest.mock("../config", () => ({
  getBackendMode: jest.fn(),
}));

const mockedGetIdToken = jest.mocked(getIdToken);
const mockedGetBackendMode = jest.mocked(getBackendMode);

const user = { uid: "user-1" } as FirebaseAuthTypes.User;

const authError = (code: string): Error =>
  Object.assign(new Error(`[${code}]`), { code });

describe("validateEmulatorSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetBackendMode.mockReturnValue("emulator");
    mockedGetIdToken.mockResolvedValue("token");
  });

  it("skips the check outside emulator mode", async () => {
    mockedGetBackendMode.mockReturnValue("cloud");

    await expect(validateEmulatorSession(user)).resolves.toBe(true);
    expect(mockedGetIdToken).not.toHaveBeenCalled();
  });

  it("keeps a session whose token refreshes", async () => {
    await expect(validateEmulatorSession(user)).resolves.toBe(true);
    expect(mockedGetIdToken).toHaveBeenCalledWith(user, true);
  });

  it.each([
    "auth/user-not-found",
    "auth/user-disabled",
    "auth/user-token-expired",
    "auth/invalid-user-token",
    // iOS reports the wiped emulator's INVALID_REFRESH_TOKEN this way.
    "auth/internal-error",
  ])("treats %s as a dead session", async (code) => {
    mockedGetIdToken.mockRejectedValue(authError(code));

    await expect(validateEmulatorSession(user)).resolves.toBe(false);
  });

  it("treats an error without a code as a dead session", async () => {
    mockedGetIdToken.mockRejectedValue(new Error("boom"));

    await expect(validateEmulatorSession(user)).resolves.toBe(false);
  });

  it("rethrows a network failure", async () => {
    const error = authError("auth/network-request-failed");
    mockedGetIdToken.mockRejectedValue(error);

    await expect(validateEmulatorSession(user)).rejects.toBe(error);
  });
});
