import { CallableErrorCode } from "@/types/callable";

const CALLABLE_ERROR_CODES: CallableErrorCode[] = [
  "ok",
  "cancelled",
  "unknown",
  "invalid-argument",
  "deadline-exceeded",
  "not-found",
  "already-exists",
  "permission-denied",
  "resource-exhausted",
  "failed-precondition",
  "aborted",
  "out-of-range",
  "unimplemented",
  "internal",
  "unavailable",
  "data-loss",
  "unauthenticated",
];

// A callable function failure, keeping the server's error code next to its
// message so the UI can tell a rule the user broke from an outage.
export class CallableError extends Error {
  code: CallableErrorCode;

  constructor(code: CallableErrorCode, message: string) {
    super(message);
    this.name = "CallableError";
    this.code = code;
  }
}

// The callable protocol sends the code as its canonical status name, e.g.
// "FAILED_PRECONDITION". Anything unrecognised is treated as "unknown".
export const toCallableErrorCode = (status: string): CallableErrorCode => {
  const code = status.toLowerCase().replace(/_/g, "-");
  return CALLABLE_ERROR_CODES.find((entry) => entry === code) ?? "unknown";
};

// Failures that may pass on their own (an outage, a timeout, a server bug), so
// asking the user to try again makes sense. Every other code is a rule the
// request broke, and retrying the same request fails the same way.
const RETRYABLE_CODES: CallableErrorCode[] = [
  "unknown",
  "internal",
  "unavailable",
  "deadline-exceeded",
  "aborted",
  "cancelled",
  "data-loss",
];

const RETRY_HINT = "Please try again.";
const FALLBACK_MESSAGE = "Something went wrong";

const withRetryHint = (message: string): string =>
  /[.!?]$/.test(message)
    ? `${message} ${RETRY_HINT}`
    : `${message}. ${RETRY_HINT}`;

// The body of an error alert. A server rejection (permission-denied,
// failed-precondition, ...) is shown exactly as the server worded it; only
// unexpected failures, including network errors that never reached the server,
// get a retry hint. `error` is `unknown` on purpose: it is whatever a catch
// clause caught.
export const getErrorAlertMessage = (error: unknown): string => {
  if (error instanceof CallableError) {
    return RETRYABLE_CODES.includes(error.code)
      ? withRetryHint(error.message)
      : error.message;
  }

  const message =
    error instanceof Error && error.message.length > 0
      ? error.message
      : FALLBACK_MESSAGE;

  return withRetryHint(message);
};
