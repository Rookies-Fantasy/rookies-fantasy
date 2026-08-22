import {
  MAX_BUDGET,
  MAX_LEAGUE_NAME_LENGTH,
  MAX_TEAMS,
  MIN_BUDGET,
  MIN_TEAMS,
} from "./constants";
import {
  CreateLeagueInput,
  JoinLeagueInput,
  JsonValue,
  RawPayload,
} from "./types";

// Firestore rejects document ids that are empty, contain "/", are the reserved
// relative-path segments "." / "..", or exceed 1500 bytes. Passing such a value
// to .doc() throws, which would surface to the caller as a 500 rather than the
// 400 the request actually deserves — so we validate the shape up front.
const MAX_DOCUMENT_ID_BYTES = 1500;

export type DocumentIdValidation =
  | { valid: true; id: string }
  | { valid: false; reason: "required" | "malformed" };

export const validateDocumentId = (value: JsonValue): DocumentIdValidation => {
  if (typeof value !== "string") {
    return { valid: false, reason: "required" };
  }

  const id = value.trim();

  if (id.length === 0) {
    return { valid: false, reason: "required" };
  }

  // The cap is on bytes, not characters: a multi-byte id can sit under 1500
  // characters and still exceed Firestore's limit, which would throw in .doc()
  // and produce the 500 this check exists to prevent.
  if (
    id.includes("/") ||
    id === "." ||
    id === ".." ||
    Buffer.byteLength(id, "utf8") > MAX_DOCUMENT_ID_BYTES
  ) {
    return { valid: false, reason: "malformed" };
  }

  return { valid: true, id };
};

export type LeagueIdValidation =
  | { valid: true; leagueId: string }
  | { valid: false; message: string };

export const validateLeagueId = (value: JsonValue): LeagueIdValidation => {
  const result = validateDocumentId(value);

  if (!result.valid) {
    return { valid: false, message: idErrorMessage("leagueId", result.reason) };
  }

  return { valid: true, leagueId: result.id };
};

const idErrorMessage = (
  field: string,
  reason: "required" | "malformed",
): string => `Invalid request: ${field} is ${reason}`;

export type JoinLeagueValidation =
  | { valid: true; input: JoinLeagueInput }
  | { valid: false; message: string };

// Validates a `joinLeague` payload. Note there is no userId here: the joining
// user is taken from the verified auth context, never from the request body.
export const validateJoinLeagueInput = (
  payload: RawPayload,
): JoinLeagueValidation => {
  const leagueId = validateDocumentId(payload.leagueId);
  if (!leagueId.valid) {
    return {
      valid: false,
      message: idErrorMessage("leagueId", leagueId.reason),
    };
  }

  const teamId = validateDocumentId(payload.teamId);
  if (!teamId.valid) {
    return { valid: false, message: idErrorMessage("teamId", teamId.reason) };
  }

  return { valid: true, input: { leagueId: leagueId.id, teamId: teamId.id } };
};

export type CreateLeagueValidation =
  | { valid: true; input: CreateLeagueInput }
  | { valid: false; message: string };

const isWholeNumberInRange = (
  value: JsonValue,
  min: number,
  max: number,
): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

const isFiniteNumberInRange = (
  value: JsonValue,
  min: number,
  max: number,
): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

// Validates a `createLeague` payload. Every field the league document ends up
// holding is derived from here or from the verified auth context — anything else
// the caller sends (creatorUserId, userIds, memberCount, ...) is discarded.
export const validateCreateLeagueInput = (
  payload: RawPayload,
): CreateLeagueValidation => {
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
  if (!isWholeNumberInRange(numberOfTeams, MIN_TEAMS, MAX_TEAMS)) {
    return {
      valid: false,
      message: `Number of teams must be a whole number between ${MIN_TEAMS} and ${MAX_TEAMS}`,
    };
  }

  const budget = payload.budget;
  if (!isFiniteNumberInRange(budget, MIN_BUDGET, MAX_BUDGET)) {
    return {
      valid: false,
      message: `Budget must be between ${MIN_BUDGET} and ${MAX_BUDGET}`,
    };
  }

  const initialTeamId = validateDocumentId(payload.initialTeamId);
  if (!initialTeamId.valid) {
    return {
      valid: false,
      message: idErrorMessage("initialTeamId", initialTeamId.reason),
    };
  }

  return {
    valid: true,
    input: { name, numberOfTeams, budget, initialTeamId: initialTeamId.id },
  };
};
