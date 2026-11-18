import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { LeagueReadyScenarioResult } from "../../emulator/scenarios/leagueReady.js";
import { type Actor, type Exchange, callableError } from "../core/http.js";
import { type JsonObject, type JsonValue, toJson } from "../core/json.js";

export type FeatureContext = {
  db: Firestore;
  auth: Auth;
  seed: LeagueReadyScenarioResult;
  actor: (email: string) => Promise<Actor>;
};

export type Check = { passed: boolean; actual: string };

export type CaseOutcome = {
  check: Check;
  preconditions: string[];
  exchanges: Exchange[];
  state: JsonObject;
};

export type FeatureCase = {
  id: string;
  title: string;
  entryPoint: string;
  expected: string;
  run: (context: FeatureContext) => Promise<CaseOutcome>;
};

export type Feature = {
  id: string;
  title: string;
  cases: FeatureCase[];
};

export const check = (passed: boolean, actual: string): Check => ({
  passed,
  actual,
});

export const allOf = (...checks: Check[]): Check => ({
  passed: checks.every((entry) => entry.passed),
  actual: checks.map((entry) => entry.actual).join("; "),
});

export const expectCallableError = (
  exchange: Exchange,
  status: string,
  message: string,
): Check => {
  const error = callableError(exchange);
  return check(
    error.status === status && error.message === message,
    `${exchange.response.status} ${error.status || "no error"}: ${error.message || JSON.stringify(exchange.response.body)}`,
  );
};

export const readDoc = async (
  db: Firestore,
  documentPath: string,
): Promise<JsonValue> => {
  const snapshot = await db.doc(documentPath).get();
  return snapshot.exists ? toJson(snapshot.data() ?? {}) : null;
};

export const countLeagues = async (db: Firestore): Promise<number> =>
  (await db.collection("leagues").get()).size;

// The app writes a new league team to users/{uid}/teams before it calls
// createLeague or joinLeague (UserController.addUserTeam). Drives stage that
// document directly, since it is a precondition rather than the behavior under
// test.
export const stageLeagueTeam = async (
  db: Firestore,
  userId: string,
  teamId: string,
  name: string,
): Promise<string> => {
  await db.doc(`users/${userId}/teams/${teamId}`).set({
    name,
    abbreviation: "VRF",
    logoUrl: "../assets/images/team/1.png",
    isLeagueTeam: true,
    balance: 150_000_000,
    record: { wins: 0, losses: 0, draws: 0 },
    createdAt: new Date(),
  });
  return `league team users/${userId}/teams/${teamId} ("${name}")`;
};
