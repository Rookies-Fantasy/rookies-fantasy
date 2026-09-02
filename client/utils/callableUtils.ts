import { getAuth } from "@react-native-firebase/auth";
import { getFunctionBaseUrl } from "@/firebase/config";
import { isNil } from "@/utils/jsUtils";

export type CallablePayload = Record<string, string | number | boolean>;

// The callable wire protocol: the payload goes out as `{ data }` and comes back
// as `{ result }` or `{ error: { message } }`. @react-native-firebase/functions
// is not installed — it would force a native rebuild — so we speak it over fetch.
type CallableResponseBody<TResult> = {
  result: TResult | null;
  error: { message: string } | null;
};

// Infrastructure failures (gateway errors, cold-start timeouts) can answer with
// HTML or an empty body, so the wire shape is normalised here and the status
// code drives the message when there is nothing to read.
const readCallableBody = async <TResult>(
  response: Response,
): Promise<CallableResponseBody<TResult>> => {
  try {
    const parsed: Partial<CallableResponseBody<TResult>> =
      await response.json();

    return { result: parsed.result ?? null, error: parsed.error ?? null };
  } catch {
    return { result: null, error: null };
  }
};

// Server error messages are surfaced to the user as-is, so the server stays the
// single source of truth for failure copy.
const unwrapCallableResponse = <TResult>(
  status: number,
  body: CallableResponseBody<TResult>,
): TResult => {
  if (status < 200 || status > 299) {
    const message = isNil(body.error) ? "" : body.error.message;

    throw new Error(
      message.length > 0 ? message : `Request failed with status ${status}`,
    );
  }

  if (isNil(body.result)) {
    throw new Error("The server returned an empty response");
  }

  return body.result;
};

const getIdToken = async (signedOutMessage: string): Promise<string> => {
  const currentUser = getAuth().currentUser;

  if (isNil(currentUser)) {
    throw new Error(signedOutMessage);
  }

  return currentUser.getIdToken();
};

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

  const body = await readCallableBody<TResult>(response);

  return unwrapCallableResponse<TResult>(response.status, body);
};
