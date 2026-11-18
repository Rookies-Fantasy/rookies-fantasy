import { HOST, PORTS, PROJECT_ID, REGION } from "./config.js";
import {
  type JsonObject,
  type JsonValue,
  getField,
  getString,
  parseJsonText,
} from "./json.js";

// Who a request is sent as. The token is never written to evidence; the label is.
export type Actor = { label: string; token: string | null };

export const SIGNED_OUT: Actor = { label: "signed out", token: null };

export type Exchange = {
  request: {
    method: "GET" | "POST";
    url: string;
    actor: string;
    body: JsonValue;
  };
  response: { status: number; body: JsonValue };
};

export type CallableError = { status: string; message: string };

export const functionUrl = (name: string): string =>
  `http://${HOST}:${PORTS.functions}/${PROJECT_ID}/${REGION}/${name}`;

const send = async (
  method: "GET" | "POST",
  url: string,
  actor: Actor,
  body: JsonValue,
): Promise<Exchange> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (actor.token !== null) {
    headers.Authorization = `Bearer ${actor.token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(body) : null,
  });

  return {
    request: { method, url, actor: actor.label, body },
    response: {
      status: response.status,
      body: parseJsonText(await response.text()),
    },
  };
};

// Same request shape as client/utils/callableUtils.ts: POST { data } with a
// Firebase ID token, which is how the app calls onCall functions.
export const callCallable = (
  name: string,
  data: JsonObject,
  actor: Actor,
): Promise<Exchange> => send("POST", functionUrl(name), actor, { data });

// Same request shape as LeagueController.getLeagueTeams: a GET with a query
// string and a Bearer token.
export const getFunction = (
  name: string,
  query: Record<string, string>,
  actor: Actor,
): Promise<Exchange> =>
  send(
    "GET",
    `${functionUrl(name)}?${new URLSearchParams(query).toString()}`,
    actor,
    null,
  );

export const callableResult = (exchange: Exchange): JsonValue =>
  getField(exchange.response.body, "result");

export const callableError = (exchange: Exchange): CallableError => {
  const error = getField(exchange.response.body, "error");
  return {
    status: getString(error, "status"),
    message: getString(error, "message"),
  };
};

export const signIn = async (
  email: string,
  password: string,
): Promise<Actor> => {
  const url = `http://${HOST}:${PORTS.auth}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=verify-rookies-fantasy`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = parseJsonText(await response.text());
  const token = getString(body, "idToken");

  if (!response.ok || token.length === 0) {
    throw new Error(
      `Sign-in failed for ${email}: ${response.status} ${JSON.stringify(body)}`,
    );
  }

  return { label: email, token };
};
