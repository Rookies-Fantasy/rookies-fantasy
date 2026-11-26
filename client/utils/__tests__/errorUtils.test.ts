import { describe, expect, it } from "@jest/globals";
import { CallableErrorCode } from "@/types/callable";
import {
  CallableError,
  getErrorAlertMessage,
  toCallableErrorCode,
} from "@/utils/errorUtils";

describe("toCallableErrorCode", () => {
  it("maps the callable protocol's status names to error codes", () => {
    expect(toCallableErrorCode("FAILED_PRECONDITION")).toBe(
      "failed-precondition",
    );
    expect(toCallableErrorCode("PERMISSION_DENIED")).toBe("permission-denied");
    expect(toCallableErrorCode("INTERNAL")).toBe("internal");
  });

  it("falls back to unknown for anything unrecognised", () => {
    expect(toCallableErrorCode("")).toBe("unknown");
    expect(toCallableErrorCode("NOT_A_CODE")).toBe("unknown");
  });
});

describe("getErrorAlertMessage", () => {
  const rejections: [CallableErrorCode, string][] = [
    ["permission-denied", "Only the league owner can edit this league"],
    [
      "failed-precondition",
      "Budget can't be changed after other teams have joined",
    ],
    ["invalid-argument", "League name is required"],
    ["not-found", "League not found"],
    ["already-exists", "Team already joined"],
    ["resource-exhausted", "League is full"],
    ["unauthenticated", "You must be signed in to edit a league"],
  ];

  it.each(rejections)(
    "shows a %s rejection exactly as the server worded it",
    (code, message) => {
      expect(getErrorAlertMessage(new CallableError(code, message))).toBe(
        message,
      );
    },
  );

  it.each(["internal", "unavailable", "unknown", "deadline-exceeded"] as const)(
    "adds a retry hint to an unexpected %s error",
    (code) => {
      expect(
        getErrorAlertMessage(
          new CallableError(code, "Failed to update league"),
        ),
      ).toBe("Failed to update league. Please try again.");
    },
  );

  it("doesn't double up punctuation before the retry hint", () => {
    expect(
      getErrorAlertMessage(new CallableError("internal", "Server error.")),
    ).toBe("Server error. Please try again.");
  });

  it("adds a retry hint to errors that never reached the server", () => {
    expect(getErrorAlertMessage(new TypeError("Network request failed"))).toBe(
      "Network request failed. Please try again.",
    );
  });

  it("falls back to a generic message for anything that isn't an Error", () => {
    expect(getErrorAlertMessage("boom")).toBe(
      "Something went wrong. Please try again.",
    );
    expect(getErrorAlertMessage(new Error(""))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
