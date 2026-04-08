import type {
  TeamDoc,
  NbaPlayerDoc,
  LineupSlot,
  LineupPlayer,
} from "../types/firestore.js";
import { SLOT_ORDER } from "../types/firestore.js";
import { NBA_TEAMS } from "../data/nbaTeams.js";
import { NBA_PLAYERS } from "../data/nbaPlayers.js";

export const TEAM_BALANCE = 150_000_000;

const FANTASY_TEAM_NAMES = [
  { name: "Rim Rockers", abbreviation: "RRM" },
  { name: "Net Ninjas", abbreviation: "NNJ" },
  { name: "Dunk Dynasty", abbreviation: "DDY" },
  { name: "Court Crushers", abbreviation: "CCR" },
  { name: "Basket Cases", abbreviation: "BCZ" },
  { name: "Alley Oop Army", abbreviation: "AOA" },
  { name: "Triple Threat", abbreviation: "TPT" },
  { name: "Fast Break Force", abbreviation: "FBF" },
  { name: "Block Party", abbreviation: "BPK" },
  { name: "Downtown Dunkers", abbreviation: "DTD" },
];

const AUGMENT_IDS = ["block-party", "frontcourt-focus"];

/**
 * Converts a top-level NbaPlayerDoc into the embedded LineupPlayer shape
 * stored inside lineup slots (different field names from the collection doc).
 */
export function playerToLineupPlayer(player: NbaPlayerDoc): LineupPlayer {
  const teamAbbreviation = NBA_TEAMS.find((t) => t.id === player.teamId)?.abbreviation ?? player.teamId;
  return {
    id: player.playerId,
    firstName: player.firstName,
    lastName: player.lastName,
    positions: player.positions,
    teamId: player.teamId,
    teamAbbreviation,
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
  const fantasyTeam = FANTASY_TEAM_NAMES[Math.floor(Math.random() * FANTASY_TEAM_NAMES.length)];
  const augmentId = AUGMENT_IDS[Math.floor(Math.random() * AUGMENT_IDS.length)];

  // Populate lineup slots by primary position
  const pg = NBA_PLAYERS.find((p) => p.positions[0] === "PG") ?? null;
  const sg = NBA_PLAYERS.find((p) => p.positions[0] === "SG") ?? null;
  const sf = NBA_PLAYERS.find((p) => p.positions[0] === "SF") ?? null;
  const pf = NBA_PLAYERS.find((p) => p.positions[0] === "PF") ?? null;
  const c = NBA_PLAYERS.find((p) => p.positions[0] === "C") ?? null;

  const wins = Math.floor(Math.random() * 15);
  const losses = Math.floor(Math.random() * 15);
  const draws = Math.floor(Math.random() * 3);

  return {
    id: crypto.randomUUID(),
    name: fantasyTeam.name,
    abbreviation: fantasyTeam.abbreviation,
    logoUrl: "https://via.placeholder.com/150",
    balance: TEAM_BALANCE,
    lineup: createLineupSlots([pg, sg, sf, pf, c, null, null, null]),
    record: { wins, losses, draws },
    augmentId,
    weeklyAcquisitionsUsed: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
