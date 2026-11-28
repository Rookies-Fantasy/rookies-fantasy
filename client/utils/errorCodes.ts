import { CaughtError } from "@/types/error";

export const NETWORK_ERROR_CODE = "auth/network-request-failed";

export const getErrorCode = (error: CaughtError): string =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string"
    ? error.code
    : "";
