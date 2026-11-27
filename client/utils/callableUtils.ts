import { getAuth } from "@react-native-firebase/auth";
import { getFunctionUrl } from "@/firebase/config";
import { CallableError, toCallableErrorCode } from "@/utils/errorUtils";
import { isNil } from "@/utils/jsUtils";

export type CallablePayload = Record<string, string | number | boolean>;

type CallableErrorBody = { message: string; status: string };

type CallableResponseBody<TResult> = {
  result: TResult | null;
  error: CallableErrorBody | null;
};

// The wire format of a callable response, before it is checked.
type RawCallableResponseBody<TResult> = {
  result?: TResult | null;
  error?: Partial<CallableErrorBody> | null;
};

const readCallableBody = async <TResult>(
  response: Response,
): Promise<CallableResponseBody<TResult>> => {
  try {
    const parsed: RawCallableResponseBody<TResult> = await response.json();
    const error = parsed.error ?? null;

    return {
      result: parsed.result ?? null,
      error: isNil(error)
        ? null
        : { message: error.message ?? "", status: error.status ?? "" },
    };
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
    const code = toCallableErrorCode(
      isNil(body.error) ? "" : body.error.status,
    );

    throw new CallableError(
      code,
      message.length > 0 ? message : `Request failed with status ${status}`,
    );
  }

  if (isNil(body.result)) {
    throw new Error("The server returned an empty response");
  }

  return body.result;
};

export const getIdToken = async (signedOutMessage: string): Promise<string> => {
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

  const response = await fetch(getFunctionUrl(functionName), {
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
