import {
  JsonValue,
  LeagueDocument,
  LeagueStandingTeam,
  RawPayload,
  TeamRecord,
} from "./types";

const toStringValue = (value: JsonValue): string =>
  typeof value === "string" ? value : "";

const toNumberValue = (value: JsonValue): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const toStringArray = (value: JsonValue): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

const isRawPayload = (value: JsonValue): value is RawPayload =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Firestore hands back untyped documents. Everything the server decides on is
// read through these mappers so a malformed or partially written document
// degrades to typed defaults instead of leaking `any` into the logic.
export const toLeagueDocument = (data: RawPayload): LeagueDocument => ({
  name: toStringValue(data.name),
  creatorUserId: toStringValue(data.creatorUserId),
  numberOfTeams: toNumberValue(data.numberOfTeams),
  budget: toNumberValue(data.budget),
  memberCount: toNumberValue(data.memberCount),
  teamIds: toStringArray(data.teamIds),
  userIds: toStringArray(data.userIds),
});

const toTeamRecord = (value: JsonValue): TeamRecord => {
  if (!isRawPayload(value)) {
    return { wins: 0, losses: 0, draws: 0 };
  }

  return {
    wins: toNumberValue(value.wins),
    losses: toNumberValue(value.losses),
    draws: toNumberValue(value.draws),
  };
};

export const toStandingTeam = (
  id: string,
  data: RawPayload,
): LeagueStandingTeam => ({
  id,
  name: toStringValue(data.name),
  logoUrl: toStringValue(data.logoUrl),
  record: toTeamRecord(data.record),
});
