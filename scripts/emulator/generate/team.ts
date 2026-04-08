import type {
  TeamDoc,
  NbaPlayerDoc,
  LineupSlot,
  LineupPlayer,
} from "../types/firestore.js";
import { SLOT_ORDER } from "../types/firestore.js";
import { NBA_TEAMS } from "../data/nbaTeams.js";

export const TEAM_BALANCE = 150_000_000;

/**
 * Converts a top-level NbaPlayerDoc into the embedded LineupPlayer shape
 * stored inside lineup slots (different field names from the collection doc).
 */
export function playerToLineupPlayer(player: NbaPlayerDoc): LineupPlayer {
  return {
    id: player.playerId,
    firstName: player.firstName,
    lastName: player.lastName,
    positions: player.positions,
    teamId: player.teamId,
    teamAbbreviation: player.teamId, // callers can override via createLineupSlots
    headshotUrl: player.headshotURL,
    height: player.height,
    weight: player.weight,
    jerseyNumber: player.jerseyNumber,
    salary: player.salary,
    gamesPlayed: player.gamesPlayed,
    averageStats: player.averageStats,
    gamelog: player.gamelog,
  };
}

/**
 * Maps an array of players (or nulls) onto the 8 lineup slot positions in order:
 * PG, SG, SF, PF, C, UTIL1, UTIL2, UTIL3.
 * Extra players beyond 8 are ignored; missing slots are filled with null.
 */
export function createLineupSlots(players: (NbaPlayerDoc | null)[]): LineupSlot[] {
  return SLOT_ORDER.map((position, index) => ({
    position,
    player: players[index] ? playerToLineupPlayer(players[index]!) : null,
  }));
}

export function createTeamDoc(overrides?: Partial<TeamDoc>): TeamDoc {
  const now = new Date();
  const nbaTeam = NBA_TEAMS[Math.floor(Math.random() * NBA_TEAMS.length)];
  return {
    id: crypto.randomUUID(),
    name: `${nbaTeam.city} ${nbaTeam.name}`,
    abbreviation: nbaTeam.abbreviation,
    logoUrl: "https://via.placeholder.com/150",
    balance: TEAM_BALANCE,
    lineup: createLineupSlots([]),
    bench: [],
    record: { wins: 0, losses: 0, draws: 0 },
    weeklyAcquisitionsUsed: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
