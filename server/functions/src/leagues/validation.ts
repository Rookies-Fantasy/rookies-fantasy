import {
  CreateLeagueInput,
  JoinLeagueInput,
  JsonValue,
  LeagueDocument,
  BUDGET_STEP,
  MAX_BUDGET,
  MAX_LEAGUE_NAME_LENGTH,
  MAX_TEAMS,
  MIN_BUDGET,
  MIN_TEAMS,
  TEAMS_STEP,
  RawPayload,
} from "./types";

type InputValidation<TInput> =
  | { valid: true; input: TInput }
  | { valid: false; message: string };

export type JoinRejectionCode =
  | "team-already-joined"
  | "user-already-joined"
  | "league-full";

export type JoinEligibility =
  | { allowed: true }
  | { allowed: false; code: JoinRejectionCode; message: string };

const isFiniteNumber = (value: JsonValue): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isStringArray = (value: JsonValue): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

// Firestore hands back untyped documents. A league doc is written only by the
// server, so a field that fails to parse means the data is corrupt — returning
// null lets the caller fail loudly instead of joining against typed defaults.
export const toLeagueDocument = (data: RawPayload): LeagueDocument | null => {
  const {
    name,
    creatorUserId,
    numberOfTeams,
    budget,
    memberCount,
    teamIds,
    userIds,
  } = data;

  if (
    typeof name !== "string" ||
    typeof creatorUserId !== "string" ||
    !isFiniteNumber(numberOfTeams) ||
    !isFiniteNumber(budget) ||
    !isFiniteNumber(memberCount) ||
    !isStringArray(teamIds) ||
    !isStringArray(userIds)
  ) {
    return null;
  }

  return {
    name,
    creatorUserId,
    numberOfTeams,
    budget,
    memberCount,
    teamIds,
    userIds,
  };
};

// Passing an empty id, or one containing "/", to .doc() throws — which would
// reach the caller as a 500 rather than the 400 the request deserves. Ids that
// are merely wrong still resolve to a missing document and answer with 404.
const readDocumentId = (value: JsonValue): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const id = value.trim();
  return id.length > 0 && !id.includes("/") ? id : null;
};

const idErrorMessage = (field: string): string =>
  `Invalid request: ${field} is missing or malformed`;

// Validates a `joinLeague` payload. Note there is no userId here: the joining
// user is taken from the verified auth context, never from the request body.
export const validateJoinLeagueInput = (
  payload: RawPayload,
): InputValidation<JoinLeagueInput> => {
  const leagueId = readDocumentId(payload.leagueId);
  if (leagueId === null) {
    return { valid: false, message: idErrorMessage("leagueId") };
  }

  const teamId = readDocumentId(payload.teamId);
  if (teamId === null) {
    return { valid: false, message: idErrorMessage("teamId") };
  }

  return { valid: true, input: { leagueId, teamId } };
};

// A value the UI could actually have produced: inside the bounds, and landing on
// one of the steps the stepper offers from `min` upwards.
const isOnScale = (
  value: JsonValue,
  min: number,
  max: number,
  step: number,
): value is number =>
  isFiniteNumber(value) &&
  value >= min &&
  value <= max &&
  (value - min) % step === 0;

// Validates a `createLeague` payload. Every field the league document ends up
// holding is derived from here or from the verified auth context — anything else
// the caller sends (creatorUserId, userIds, memberCount, ...) is discarded.
export const validateCreateLeagueInput = (
  payload: RawPayload,
): InputValidation<CreateLeagueInput> => {
  const rawName = payload.name;

  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    return { valid: false, message: "League name is required" };
  }

  const name = rawName.trim();
  if (name.length > MAX_LEAGUE_NAME_LENGTH) {
    return {
      valid: false,
      message: `League name must be at most ${MAX_LEAGUE_NAME_LENGTH} characters`,
    };
  }

  const numberOfTeams = payload.numberOfTeams;
  if (!isOnScale(numberOfTeams, MIN_TEAMS, MAX_TEAMS, TEAMS_STEP)) {
    return {
      valid: false,
      message: `Number of teams must be between ${MIN_TEAMS} and ${MAX_TEAMS}, in steps of ${TEAMS_STEP}`,
    };
  }

  const budget = payload.budget;
  if (!isOnScale(budget, MIN_BUDGET, MAX_BUDGET, BUDGET_STEP)) {
    return {
      valid: false,
      message: `Budget must be between ${MIN_BUDGET} and ${MAX_BUDGET}, in steps of ${BUDGET_STEP}`,
    };
  }

  const initialTeamId = readDocumentId(payload.initialTeamId);
  if (initialTeamId === null) {
    return { valid: false, message: idErrorMessage("initialTeamId") };
  }

  return {
    valid: true,
    input: { name, numberOfTeams, budget, initialTeamId },
  };
};

const reject = (code: JoinRejectionCode, message: string): JoinEligibility => ({
  allowed: false,
  code,
  message,
});

// The preconditions that used to live in the client-side Firestore transaction
// (client/controllers/leagueController.ts). They are enforced here so the league
// document can only ever be grown by the server. Messages match the previous
// client-thrown errors so existing UI copy keeps working.
export const evaluateJoinEligibility = (
  league: LeagueDocument,
  teamId: string,
  userId: string,
): JoinEligibility => {
  if (league.teamIds.includes(teamId)) {
    return reject("team-already-joined", "Team already joined");
  }

  if (league.userIds.includes(userId)) {
    return reject("user-already-joined", "User already joined");
  }

  // memberCount is only a counter, so the membership arrays are checked too:
  // whichever is furthest along decides whether the league is full.
  const membership = Math.max(
    league.memberCount,
    league.teamIds.length,
    league.userIds.length,
  );

  if (membership >= league.numberOfTeams) {
    return reject("league-full", "League is full");
  }

  return { allowed: true };
};
