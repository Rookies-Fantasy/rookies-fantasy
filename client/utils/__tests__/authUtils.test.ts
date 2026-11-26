import "@react-native-google-signin/google-signin/jest/build/jest/setup";
import { appleAuth } from "@invertase/react-native-apple-authentication";
import { describe, expect, it, jest } from "@jest/globals";
import { statusCodes } from "@react-native-google-signin/google-signin";
import { LoginProvider } from "@/types/providers";
import { getAuthErrorCode, getSsoErrorMessage } from "@/utils/authUtils";

// The Apple package ships untranspiled ESM, so mock it with its real error codes.
jest.mock("@invertase/react-native-apple-authentication", () => ({
  appleAuth: {
    Error: { UNKNOWN: "1000", CANCELED: "1001", FAILED: "1004" },
    Scope: { EMAIL: 0 },
    isSupported: false,
  },
}));

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: () => ({ signInWithCredential: jest.fn() }),
}));

const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your internet connection and try again.";

describe("getAuthErrorCode", () => {
  it("returns the code of an error object", () => {
    expect(getAuthErrorCode({ code: "auth/network-request-failed" })).toBe(
      "auth/network-request-failed",
    );
  });

  it("returns an empty string when there is no string code", () => {
    expect(getAuthErrorCode(new Error("boom"))).toBe("");
    expect(getAuthErrorCode({ code: 1000 })).toBe("");
    expect(getAuthErrorCode(null)).toBe("");
    expect(getAuthErrorCode("auth/network-request-failed")).toBe("");
  });
});

describe("getSsoErrorMessage for Apple", () => {
  it("points to Settings when the device isn't signed in to an Apple Account", () => {
    expect(
      getSsoErrorMessage(LoginProvider.Apple, appleAuth.Error.UNKNOWN),
    ).toBe(
      "We couldn't sign you in with Apple. Make sure you're signed in to your Apple Account in Settings, then try again.",
    );
  });

  it("suggests other sign-in methods when the email is already registered", () => {
    expect(
      getSsoErrorMessage(
        LoginProvider.Apple,
        "auth/account-exists-with-different-credential",
      ),
    ).toBe(
      "An account already exists with this email. Sign in with Google or your email and password instead.",
    );
  });

  it("explains network failures", () => {
    expect(
      getSsoErrorMessage(LoginProvider.Apple, "auth/network-request-failed"),
    ).toBe(NETWORK_MESSAGE);
  });

  it("falls back to a generic message", () => {
    expect(getSsoErrorMessage(LoginProvider.Apple, "")).toBe(
      "We couldn't sign you in with Apple. Please try again.",
    );
    expect(
      getSsoErrorMessage(LoginProvider.Apple, appleAuth.Error.FAILED),
    ).toBe("We couldn't sign you in with Apple. Please try again.");
  });
});

describe("getSsoErrorMessage for Google", () => {
  it("explains missing Play Services", () => {
    expect(
      getSsoErrorMessage(
        LoginProvider.Google,
        statusCodes.PLAY_SERVICES_NOT_AVAILABLE,
      ),
    ).toBe(
      "Google Play Services is unavailable or out of date on this device. Update it, then try again.",
    );
  });

  it("suggests other sign-in methods when the email is already registered", () => {
    expect(
      getSsoErrorMessage(
        LoginProvider.Google,
        "auth/account-exists-with-different-credential",
      ),
    ).toBe(
      "An account already exists with this email. Sign in with Apple or your email and password instead.",
    );
  });

  it("explains network failures", () => {
    expect(
      getSsoErrorMessage(LoginProvider.Google, "auth/network-request-failed"),
    ).toBe(NETWORK_MESSAGE);
  });

  it("falls back to a generic message", () => {
    expect(getSsoErrorMessage(LoginProvider.Google, "")).toBe(
      "We couldn't sign you in with Google. Please try again.",
    );
    expect(
      getSsoErrorMessage(LoginProvider.Google, appleAuth.Error.UNKNOWN),
    ).toBe("We couldn't sign you in with Google. Please try again.");
  });
});
