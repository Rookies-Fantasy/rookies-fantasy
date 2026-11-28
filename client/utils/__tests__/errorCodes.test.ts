import { describe, expect, it } from "@jest/globals";
import { getErrorCode, NETWORK_ERROR_CODE } from "@/utils/errorCodes";

describe("getErrorCode", () => {
  it("returns the code of a Firebase-style error", () => {
    const error = Object.assign(new Error("[auth/internal-error]"), {
      code: "auth/internal-error",
    });

    expect(getErrorCode(error)).toBe("auth/internal-error");
  });

  it("returns the code of a plain object", () => {
    expect(getErrorCode({ code: NETWORK_ERROR_CODE })).toBe(NETWORK_ERROR_CODE);
  });

  it.each([
    ["an error without a code", new Error("boom")],
    ["a numeric code", { code: 1000 }],
    ["null", null],
    ["a string", NETWORK_ERROR_CODE],
    ["a number", 42],
    ["a boolean", false],
  ])("returns an empty string for %s", (_label, error) => {
    expect(getErrorCode(error)).toBe("");
  });
});
