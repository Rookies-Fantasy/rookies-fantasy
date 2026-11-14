import type { TeamRecord } from "../shared/types";
import {
  CreateLeagueInput,
  JoinLeagueInput,
  JsonValue,
  LeagueDocument,
  LeagueStandingTeam,
  BUDGET_STEP,
  MAX_BUDGET,
  MAX_LEAGUE_NAME_LENGTH,
  MAX_LOGO_URL_LENGTH,
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAMS,
  MIN_BUDGET,
  MIN_TEAMS,
  NewLeagueTeam,
  TEAM_ABBREVIATION_LENGTH,
  TEAMS_STEP,
  RawPayload,
  UpdateLeagueInput,
} from "./types";

export type InputValidation<TInput> =
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

const isStringRecord = (value: JsonValue): value is Record<string, string> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === "string");

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
    teamOwners,
  } = data;

  if (
    typeof name !== "string" ||
    typeof creatorUserId !== "string" ||
    !isFiniteNumber(numberOfTeams) ||
    !isFiniteNumber(budget) ||
    !isFiniteNumber(memberCount) ||
    !isStringArray(teamIds) ||
    !isStringArray(userIds) ||
    !isStringRecord(teamOwners)
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
    teamOwners,
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

// Validates the team fields of a `joinLeague` payload. The team document is
// written by the server, so these checks are the only thing standing between a
// hand-rolled request and the stored team.
const validateNewLeagueTeam = (
  payload: RawPayload,
): InputValidation<NewLeagueTeam> => {
  const { teamName, abbreviation, logoUrl } = payload;

  if (typeof teamName !== "string" || teamName.trim().length === 0) {
    return { valid: false, message: "Team name is required" };
  }

  const name = teamName.trim();
  if (name.length > MAX_TEAM_NAME_LENGTH) {
    return {
      valid: false,
      message: `Team name must be at most ${MAX_TEAM_NAME_LENGTH} characters`,
    };
  }

  if (
    typeof abbreviation !== "string" ||
    abbreviation.trim().length !== TEAM_ABBREVIATION_LENGTH
  ) {
    return {
      valid: false,
      message: `Team abbreviation must be exactly ${TEAM_ABBREVIATION_LENGTH} characters`,
    };
  }

  if (
    typeof logoUrl !== "string" ||
    logoUrl.trim().length === 0 ||
    logoUrl.length > MAX_LOGO_URL_LENGTH
  ) {
    return { valid: false, message: "Team logo is required" };
  }

  return {
    valid: true,
    input: {
      name,
      abbreviation: abbreviation.trim(),
      logoUrl: logoUrl.trim(),
    },
  };
};

// Validates a `joinLeague` payload. Note there is no userId here: the joining
// user is taken from the verified auth context, never from the request body.
// There is no teamId either: the team is created by the join itself.
export const validateJoinLeagueInput = (
  payload: RawPayload,
): InputValidation<JoinLeagueInput> => {
  const leagueId = readDocumentId(payload.leagueId);
  if (leagueId === null) {
    return { valid: false, message: idErrorMessage("leagueId") };
  }

  const team = validateNewLeagueTeam(payload);
  if (!team.valid) {
    return team;
  }

  return { valid: true, input: { leagueId, team: team.input } };
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

// The owner-chosen settings shared by `createLeague` and `updateLeague`.
const validateLeagueSettings = (
  payload: RawPayload,
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

  return { valid: true, input: { name, numberOfTeams, budget } };
};

// Validates a `createLeague` payload. Every field the league document ends up
// holding is derived from here or from the verified auth context — anything else
// the caller sends (creatorUserId, userIds, memberCount, ...) is discarded.
export const validateCreateLeagueInput = (
  payload: RawPayload,
): InputValidation<CreateLeagueInput> => {
  const settings = validateLeagueSettings(payload);
  if (!settings.valid) {
    return settings;
  }

  const initialTeamId = readDocumentId(payload.initialTeamId);
  if (initialTeamId === null) {
    return { valid: false, message: idErrorMessage("initialTeamId") };
  }

  return { valid: true, input: { ...settings.input, initialTeamId } };
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

  const settings = validateLeagueSettings(payload);
  if (!settings.valid) {
    return settings;
  }

  return { valid: true, input: { leagueId, ...settings.input } };
};

// memberCount is only a counter, so the membership arrays are checked too:
// whichever is furthest along is how many teams the league holds.
const membershipOf = (league: LeagueDocument): number =>
  Math.max(league.memberCount, league.teamIds.length, league.userIds.length);

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

  if (membershipOf(league) >= league.numberOfTeams) {
    return reject("league-full", "League is full");
  }

  return { allowed: true };
};

export type UpdateRejectionCode =
  | "not-league-owner"
  | "below-member-count"
  | "budget-locked"
  | "roster-over-budget";

export type UpdateEligibility =
  | { allowed: true }
  | { allowed: false; code: UpdateRejectionCode; message: string };

// Only the creator may edit a league. The team count can't drop below the teams
// already in it, and the budget is locked once anyone else has joined: each
// team's balance is copied from the budget when it is created, so changing it
// afterwards would leave existing teams out of step with new ones.
export const evaluateUpdateEligibility = (
  league: LeagueDocument,
  input: UpdateLeagueInput,
  userId: string,
): UpdateEligibility => {
  if (league.creatorUserId !== userId) {
    return {
      allowed: false,
      code: "not-league-owner",
      message: "Only the league owner can edit this league",
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

  if (input.budget !== league.budget && membership > 1) {
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

const toStringOrEmpty = (value: JsonValue): string =>
  typeof value === "string" ? value : "";

const toCount = (value: JsonValue): number =>
  isFiniteNumber(value) && value >= 0 ? value : 0;

const isPayload = (value: JsonValue): value is RawPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const EMPTY_RECORD: TeamRecord = { wins: 0, losses: 0, draws: 0 };

const toTeamRecord = (value: JsonValue): TeamRecord => {
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

export type LeagueTeamRef = {
  teamId: string;
  ownerId: string;
};

// Pairs each league team with the member who registered it. A team without a
// recorded owner, or whose owner is no longer a member, is skipped: standings
// read users/{ownerId}/teams/{teamId} only, so a doc that another user created
// under a league team's id is never picked up.
export const toLeagueTeamRefs = (league: LeagueDocument): LeagueTeamRef[] =>
  Array.from(new Set(league.teamIds))
    .slice(0, MAX_TEAMS)
    .flatMap((teamId) => {
      const ownerId = Object.prototype.hasOwnProperty.call(
        league.teamOwners,
        teamId,
      )
        ? league.teamOwners[teamId]
        : "";

      return league.userIds.includes(ownerId) ? [{ teamId, ownerId }] : [];
    });

export const isLeagueMember = (
  league: LeagueDocument,
  userId: string,
): boolean => userId.length > 0 && league.userIds.includes(userId);

// The team whose balance follows the budget. A budget change is only allowed
// while the owner is the sole member, so the league's only team is theirs.
// Returns null when the league has no single team to recompute.
export const getOwnerTeamId = (league: LeagueDocument): string | null =>
  league.teamIds.length === 1 ? league.teamIds[0] : null;

// The salary of the player in one lineup or bench slot: 0 for an empty slot,
// null when the slot or its player is malformed.
const slotSalary = (slot: JsonValue): number | null => {
  if (!isPayload(slot)) {
    return null;
  }

  const player = slot.player ?? null;
  if (player === null) {
    return 0;
  }

  if (!isPayload(player) || !isFiniteNumber(player.salary)) {
    return null;
  }

  return player.salary;
};

// What a team's players cost: the salaries of everyone in its lineup and on
// its bench. Mirrors the client's team builder (`addPlayerToLineup` /
// `removePlayerFromLineup` in client/state/slices/teamSlice.ts), which takes a
// player's salary out of the balance when they join the lineup and keeps it
// out while they sit on the bench. Returns null when the roster is malformed,
// so the caller fails loudly instead of writing a wrong balance.
export const toRosterCost = (team: RawPayload): number | null => {
  const lineup = team.lineup ?? [];
  const bench = team.bench ?? [];

  if (!Array.isArray(lineup) || !Array.isArray(bench)) {
    return null;
  }

  let cost = 0;
  for (const slot of [...lineup, ...bench]) {
    const salary = slotSalary(slot);
    if (salary === null) {
      return null;
    }
    cost += salary;
  }

  return cost;
};

const formatMillions = (value: number): string =>
  `$${Math.round(value / 1_000_000)}M`;

export type BalanceRecompute =
  | { allowed: true; balance: number }
  | { allowed: false; code: UpdateRejectionCode; message: string };

// The owner's balance under a new budget: what is left after paying for the
// players they already have. Recomputing from the roster, rather than shifting
// the old balance by the difference, also corrects a balance that has drifted.
// A budget the roster doesn't fit in is rejected rather than leaving the team
// with a negative balance.
export const recomputeBalance = (
  budget: number,
  rosterCost: number,
): BalanceRecompute => {
  if (rosterCost > budget) {
    return {
      allowed: false,
      code: "roster-over-budget",
      message: `Your roster costs ${formatMillions(rosterCost)}, which is more than a ${formatMillions(budget)} budget`,
    };
  }

  return { allowed: true, balance: budget - rosterCost };
};
