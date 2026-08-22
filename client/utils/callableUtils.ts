import { getAuth } from "@react-native-firebase/auth";
import { getFunctionBaseUrl } from "@/firebase/config";
import { isNil } from "@/utils/jsUtils";

// Firebase HTTPS callables speak a fixed wire protocol: the payload goes out
// wrapped in `{ data: ... }`, and the response comes back as either
// `{ result: ... }` or `{ error: { status, message } }`.
// @react-native-firebase/functions is not installed — adding it would force a
// native rebuild — so the protocol is spoken directly over fetch here.

export type CallablePayload = Record<string, string | number | boolean>;

export type CallableResponseBody<TResult> = {
  result?: TResult;
  error?: { status?: string; message?: string };
};

export const EMPTY_RESULT_ERROR = "The server returned an empty response";

// Turns a callable's HTTP status + parsed body into its result, or throws with
// the server's own message. The messages are surfaced to the user as-is, so the
// server stays the single source of truth for failure copy.
export const unwrapCallableResponse = <TResult>(
  status: number,
  body: CallableResponseBody<TResult>,
): TResult => {
  if (status < 200 || status > 299) {
    const message = body.error?.message ?? "";
    throw new Error(
      message.length > 0 ? message : `Request failed with status ${status}`,
    );
  }

  const result = body.result;
  if (isNil(result)) {
    throw new Error(EMPTY_RESULT_ERROR);
  }

  return result;
};

// Resolves the signed-in user's ID token, or throws the caller's own
// "you must be signed in" copy. Shared by every authenticated function call so
// the unauthenticated path can't drift between them.
export const getIdToken = async (signedOutMessage: string): Promise<string> => {
  const currentUser = getAuth().currentUser;

  if (isNil(currentUser)) {
    throw new Error(signedOutMessage);
  }

  return currentUser.getIdToken();
};

const readCallableBody = async <TResult>(
  response: Response,
): Promise<CallableResponseBody<TResult>> => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

// POSTs to an HTTPS callable and returns its result, throwing the server's error
// message on failure.
export const callFunction = async <TResult>(
  functionName: string,
  data: CallablePayload,
  signedOutMessage: string,
): Promise<TResult> => {
  const idToken = await getIdToken(signedOutMessage);

  const response = await fetch(getFunctionBaseUrl(functionName), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data }),
  });

  // Infrastructure failures (gateway errors, cold-start timeouts) can answer with
  // HTML or an empty body. Falling back to an empty body lets the status code
  // drive the error message instead of throwing a JSON parse error at the caller.
  const body = await readCallableBody<TResult>(response);

  return unwrapCallableResponse<TResult>(response.status, body);
};
