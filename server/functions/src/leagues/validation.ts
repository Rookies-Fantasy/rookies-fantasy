import {
  CreateLeagueInput,
  JoinLeagueInput,
  JsonValue,
  LEAGUE_STATUSES,
  LeagueDocument,
  LeagueStatus,
  LeagueStandingTeam,
  BUDGET_STEP,
  MAX_BUDGET,
  MAX_LEAGUE_NAME_LENGTH,
  MAX_TEAMS,
  MIN_BUDGET,
  MIN_TEAMS,
  TEAMS_STEP,
  TeamRecord,
  RawPayload,
  UpdateLeagueInput,
} from "./types";
import { hasDeadlinePassed, isIsoDate } from "./season";

export type InputValidation<TInput> =
  | { valid: true; input: TInput }
  | { valid: false; message: string };

export type JoinRejectionCode =
  | "team-already-joined"
  | "user-already-joined"
  | "league-closed"
  | "league-full";

export type JoinEligibility =
  | { allowed: true }
  | { allowed: false; code: JoinRejectionCode; message: string };

const isFiniteNumber = (value: JsonValue): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isStringArray = (value: JsonValue): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isLeagueStatus = (value: JsonValue): value is LeagueStatus =>
  LEAGUE_STATUSES.some((status) => status === value);

const isNullableCount = (value: JsonValue): value is number | null =>
  value === null || isFiniteNumber(value);

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
    deadline,
    status,
    playoffTeams,
    regularSeasonWeeks,
    playoffStartWeek,
  } = data;

  if (
    typeof name !== "string" ||
    typeof creatorUserId !== "string" ||
    !isFiniteNumber(numberOfTeams) ||
    !isFiniteNumber(budget) ||
    !isFiniteNumber(memberCount) ||
    !isStringArray(teamIds) ||
    !isStringArray(userIds) ||
    !isIsoDate(deadline) ||
    !isLeagueStatus(status) ||
    !isNullableCount(playoffTeams) ||
    !isNullableCount(regularSeasonWeeks) ||
    !isNullableCount(playoffStartWeek)
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
    deadline,
    status,
    playoffTeams,
    regularSeasonWeeks,
    playoffStartWeek,
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

type LeagueSettings = Pick<LeagueDocument, "name" | "numberOfTeams" | "budget">;

// "on-scale" is the create rule. Edits use "any-count" because a scheduled league
// stores its actual (possibly odd) team count, and renaming it must still pass;
// evaluateUpdateEligibility applies the scale only when the count changes.
type TeamsRule = "on-scale" | "any-count";

const TEAMS_SCALE_MESSAGE = `Number of teams must be between ${MIN_TEAMS} and ${MAX_TEAMS}, in steps of ${TEAMS_STEP}`;

const isTeamCount = (value: JsonValue, rule: TeamsRule): value is number =>
  rule === "on-scale"
    ? isOnScale(value, MIN_TEAMS, MAX_TEAMS, TEAMS_STEP)
    : isFiniteNumber(value) && Number.isInteger(value) && value > 0;

// The owner-chosen settings shared by `createLeague` and `updateLeague`.
const validateLeagueSettings = (
  payload: RawPayload,
  teamsRule: TeamsRule,
): InputValidation<LeagueSettings> => {
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
  if (!isTeamCount(numberOfTeams, teamsRule)) {
    return { valid: false, message: TEAMS_SCALE_MESSAGE };
  }

  const budget = payload.budget;
  if (!isOnScale(budget, MIN_BUDGET, MAX_BUDGET, BUDGET_STEP)) {
    return {
      valid: false,
      message: `Budget must be between ${MIN_BUDGET} and ${MAX_BUDGET}, in steps of ${BUDGET_STEP}`,
    };
  }

  return { valid: true, input: { name, numberOfTeams, budget } };
};

// Validates a `createLeague` payload. Every field the league document ends up
// holding is derived from here or from the verified auth context — anything else
// the caller sends (creatorUserId, userIds, memberCount, ...) is discarded.
export const validateCreateLeagueInput = (
  payload: RawPayload,
): InputValidation<CreateLeagueInput> => {
  const settings = validateLeagueSettings(payload, "on-scale");
  if (!settings.valid) {
    return settings;
  }

  const initialTeamId = readDocumentId(payload.initialTeamId);
  if (initialTeamId === null) {
    return { valid: false, message: idErrorMessage("initialTeamId") };
  }

  const rawDeadline = "deadline" in payload ? payload.deadline : null;
  const deadline = isIsoDate(rawDeadline) ? rawDeadline : null;
  if (rawDeadline !== null && deadline === null) {
    return { valid: false, message: "Deadline must be a YYYY-MM-DD date" };
  }

  return {
    valid: true,
    input: { ...settings.input, initialTeamId, deadline },
  };
};

// Validates an `updateLeague` payload. Only the settings are editable; the
// owner and membership fields can't be changed through this path.
export const validateUpdateLeagueInput = (
  payload: RawPayload,
): InputValidation<UpdateLeagueInput> => {
  const leagueId = readDocumentId(payload.leagueId);
  if (leagueId === null) {
    return { valid: false, message: idErrorMessage("leagueId") };
  }

  const settings = validateLeagueSettings(payload, "any-count");
  if (!settings.valid) {
    return settings;
  }

  return { valid: true, input: { leagueId, ...settings.input } };
};

// memberCount is only a counter, so the membership arrays are checked too:
// whichever is furthest along is how many teams the league holds.
const membershipOf = (league: LeagueDocument): number =>
  Math.max(league.memberCount, league.teamIds.length, league.userIds.length);

// Registration closes when the deadline day ends (midnight PT) or once the league
// has left `forming`, whichever comes first.
const isRegistrationClosed = (league: LeagueDocument, today: string): boolean =>
  league.status !== "forming" || hasDeadlinePassed(league.deadline, today);

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
  today: string,
): JoinEligibility => {
  if (league.teamIds.includes(teamId)) {
    return reject("team-already-joined", "Team already joined");
  }

  if (league.userIds.includes(userId)) {
    return reject("user-already-joined", "User already joined");
  }

  if (isRegistrationClosed(league, today)) {
    return reject(
      "league-closed",
      "This league is no longer accepting members",
    );
  }

  if (membershipOf(league) >= league.numberOfTeams) {
    return reject("league-full", "League is full");
  }

  return { allowed: true };
};

export type UpdateRejectionCode =
  | "not-league-owner"
  | "registration-closed"
  | "invalid-team-count"
  | "below-member-count"
  | "budget-locked";

export type UpdateEligibility =
  | { allowed: true }
  | { allowed: false; code: UpdateRejectionCode; message: string };

// Only the creator may edit a league. Once registration closes, the team count
// and budget are fixed for the season; only the name can change. Before that, the
// team count can't drop below the teams already in it, and the budget is locked
// once anyone else has joined: each team's balance is copied from the budget when
// it is created, so changing it afterwards would leave existing teams out of step
// with new ones.
export const evaluateUpdateEligibility = (
  league: LeagueDocument,
  input: UpdateLeagueInput,
  userId: string,
  today: string,
): UpdateEligibility => {
  if (league.creatorUserId !== userId) {
    return {
      allowed: false,
      code: "not-league-owner",
      message: "Only the league owner can edit this league",
    };
  }

  const teamsChanged = input.numberOfTeams !== league.numberOfTeams;
  const budgetChanged = input.budget !== league.budget;

  if (isRegistrationClosed(league, today) && (teamsChanged || budgetChanged)) {
    return {
      allowed: false,
      code: "registration-closed",
      message:
        "Number of teams and budget can't be changed after the registration deadline",
    };
  }

  if (
    teamsChanged &&
    !isOnScale(input.numberOfTeams, MIN_TEAMS, MAX_TEAMS, TEAMS_STEP)
  ) {
    return {
      allowed: false,
      code: "invalid-team-count",
      message: TEAMS_SCALE_MESSAGE,
    };
  }

  const membership = membershipOf(league);

  if (input.numberOfTeams < membership) {
    return {
      allowed: false,
      code: "below-member-count",
      message: `Number of teams can't be lower than the ${membership} teams already in the league`,
    };
  }

  if (budgetChanged && membership > 1) {
    return {
      allowed: false,
      code: "budget-locked",
      message: "Budget can't be changed after other teams have joined",
    };
  }

  return { allowed: true };
};

// Validates the `leagueId` query parameter of getLeagueStandings.
export const validateLeagueId = (value: JsonValue): InputValidation<string> => {
  const leagueId = readDocumentId(value);
  if (leagueId === null) {
    return { valid: false, message: idErrorMessage("leagueId") };
  }

  return { valid: true, input: leagueId };
};

export const toStringOrEmpty = (value: JsonValue): string =>
  typeof value === "string" ? value : "";

const toCount = (value: JsonValue): number =>
  isFiniteNumber(value) && value >= 0 ? value : 0;

export const isPayload = (value: JsonValue): value is RawPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const EMPTY_RECORD: TeamRecord = { wins: 0, losses: 0, draws: 0 };

export const toTeamRecord = (value: JsonValue): TeamRecord => {
  if (!isPayload(value)) {
    return EMPTY_RECORD;
  }

  return {
    wins: toCount(value.wins),
    losses: toCount(value.losses),
    draws: toCount(value.draws),
  };
};

export const toStandingTeam = (
  id: string,
  data: RawPayload,
): LeagueStandingTeam => ({
  id,
  name: toStringOrEmpty(data.name),
  logoUrl: toStringOrEmpty(data.logoUrl),
  record: toTeamRecord(data.record),
});

export const isLeagueMember = (
  league: LeagueDocument,
  userId: string,
): boolean => userId.length > 0 && league.userIds.includes(userId);
