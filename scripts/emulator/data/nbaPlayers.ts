// Static NBA player data with real BallDontLie player IDs.
// Player IDs are sourced from the BallDontLie v1 API.
// To add more players, look up their ID at https://api.balldontlie.io/v1/players
// and add an entry matching the NbaPlayerDoc shape.

import type { NbaPlayerDoc, AverageStats, GamelogEntry } from "../types/firestore.js";

// Opponent team IDs to rotate through for mock game entries
const MOCK_OPPONENT_IDS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 17, 18, 19, 20, 21, 22, 23, 24, 25];

function generateMockGamelog(averageStats: AverageStats, teamId: string): GamelogEntry[] {
  const teamIdNum = parseInt(teamId, 10) || 1;
  const baseDate = new Date("2026-04-01");
  const entries: GamelogEntry[] = [];

  const randInt = (base: number, variance: number) =>
    Math.max(0, Math.round(base + (Math.random() * 2 - 1) * variance));
  const randPct = (base: number, variance = 0.1) =>
    +Math.min(1, Math.max(0, base + (Math.random() * 2 - 1) * variance)).toFixed(3);

  for (let i = 0; i < 10; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i * 3);

    const opponentId = MOCK_OPPONENT_IDS[i % MOCK_OPPONENT_IDS.length];
    const isHome = i % 2 === 0;

    const points = randInt(averageStats.points, 8);
    const rebounds = randInt(averageStats.rebounds, 4);
    const assists = randInt(averageStats.assists, 3);
    const steals = randInt(averageStats.steals, 1);
    const blocks = randInt(averageStats.blocks, 1);
    const turnovers = randInt(averageStats.turnovers, 2);
    const threePointersMade = randInt(averageStats.threePointersMade, 2);
    const minutes = +Math.max(0, averageStats.minutes + (Math.random() * 2 - 1) * 5).toFixed(1);
    const fantasyPoints = +(
      points +
      rebounds * 1.2 +
      assists * 1.5 +
      steals * 3 +
      blocks * 3 -
      turnovers +
      threePointersMade * 0.5
    ).toFixed(2);

    entries.push({
      date: date.toISOString().split("T")[0],
      gameId: 200000 + i,
      homeTeamId: isHome ? teamIdNum : opponentId,
      visitorTeamId: isHome ? opponentId : teamIdNum,
      teamId: teamIdNum,
      assists,
      blocks,
      fantasyPoints,
      fieldGoalPercentage: randPct(averageStats.fieldGoalPercentage),
      fieldGoalsAttempted: randInt(averageStats.fieldGoalsAttempted, 5),
      fieldGoalsMade: randInt(averageStats.fieldGoalsMade, 4),
      freeThrowPercentage: randPct(averageStats.freeThrowPercentage),
      freeThrowsAttempted: randInt(averageStats.freeThrowsAttempted, 3),
      freeThrowsMade: randInt(averageStats.freeThrowsMade, 3),
      minutes,
      personalFouls: randInt(averageStats.personalFouls, 2),
      points,
      rebounds,
      steals,
      threePointerPercentage: randPct(averageStats.threePointerPercentage),
      threePointersAttempted: randInt(averageStats.threePointersAttempted, 3),
      threePointersMade,
      turnovers,
    });
  }

  return entries;
}

type NbaPlayerBase = Omit<NbaPlayerDoc, "gamelog">;

const NBA_PLAYERS_BASE: NbaPlayerBase[] = [
  {
    playerId: "237",
    firstName: "LeBron",
    lastName: "James",
    firstNameLower: "lebron",
    lastNameLower: "james",
    fullNameLower: "lebron james",
    positions: ["SF", "PF"],
    teamId: "13",
    height: "6-9",
    weight: "250",
    jerseyNumber: "23",
    country: "USA",
    headshotURL: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png",
    salary: 12000000,
    gamesPlayed: 35,
    averageStats: {
      assists: 6.8,
      blocks: 0.6,
      fieldGoalPercentage: 0.52,
      fieldGoalsAttempted: 18.5,
      fieldGoalsMade: 9.6,
      freeThrowPercentage: 0.75,
      freeThrowsAttempted: 7.2,
      freeThrowsMade: 5.4,
      minutes: 35.2,
      personalFouls: 1.8,
      points: 25.3,
      rebounds: 8.1,
      steals: 1.3,
      threePointerPercentage: 0.38,
      threePointersAttempted: 5.8,
      threePointersMade: 2.2,
      turnovers: 3.5,
    },
  },
  {
    playerId: "203507",
    firstName: "Giannis",
    lastName: "Antetokounmpo",
    firstNameLower: "giannis",
    lastNameLower: "antetokounmpo",
    fullNameLower: "giannis antetokounmpo",
    positions: ["PF", "C"],
    teamId: "15",
    height: "6-11",
    weight: "243",
    jerseyNumber: "34",
    country: "Greece",
    headshotURL: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png",
    salary: 15000000,
    gamesPlayed: 38,
    averageStats: {
      assists: 5.8,
      blocks: 1.4,
      fieldGoalPercentage: 0.61,
      fieldGoalsAttempted: 20.1,
      fieldGoalsMade: 12.3,
      freeThrowPercentage: 0.65,
      freeThrowsAttempted: 10.2,
      freeThrowsMade: 6.6,
      minutes: 34.5,
      personalFouls: 3.2,
      points: 31.2,
      rebounds: 11.9,
      steals: 1.1,
      threePointerPercentage: 0.28,
      threePointersAttempted: 3.5,
      threePointersMade: 1.0,
      turnovers: 3.8,
    },
  },
  {
    playerId: "1629029",
    firstName: "Luka",
    lastName: "Doncic",
    firstNameLower: "luka",
    lastNameLower: "doncic",
    fullNameLower: "luka doncic",
    positions: ["PG", "SG"],
    teamId: "6",
    height: "6-7",
    weight: "230",
    jerseyNumber: "77",
    country: "Slovenia",
    headshotURL: "https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png",
    salary: 13000000,
    gamesPlayed: 36,
    averageStats: {
      assists: 8.2,
      blocks: 0.5,
      fieldGoalPercentage: 0.47,
      fieldGoalsAttempted: 21.3,
      fieldGoalsMade: 10.0,
      freeThrowPercentage: 0.78,
      freeThrowsAttempted: 8.5,
      freeThrowsMade: 6.6,
      minutes: 36.8,
      personalFouls: 2.1,
      points: 28.5,
      rebounds: 8.3,
      steals: 1.4,
      threePointerPercentage: 0.36,
      threePointersAttempted: 9.8,
      threePointersMade: 3.5,
      turnovers: 4.0,
    },
  },
  {
    playerId: "1630162",
    firstName: "Anthony",
    lastName: "Edwards",
    firstNameLower: "anthony",
    lastNameLower: "edwards",
    fullNameLower: "anthony edwards",
    positions: ["SG", "SF"],
    teamId: "16",
    height: "6-4",
    weight: "225",
    jerseyNumber: "5",
    country: "USA",
    headshotURL: "https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png",
    salary: 10000000,
    gamesPlayed: 37,
    averageStats: {
      assists: 5.1,
      blocks: 0.6,
      fieldGoalPercentage: 0.46,
      fieldGoalsAttempted: 20.5,
      fieldGoalsMade: 9.4,
      freeThrowPercentage: 0.83,
      freeThrowsAttempted: 6.8,
      freeThrowsMade: 5.6,
      minutes: 35.6,
      personalFouls: 2.3,
      points: 26.1,
      rebounds: 5.4,
      steals: 1.3,
      threePointerPercentage: 0.42,
      threePointersAttempted: 8.9,
      threePointersMade: 3.7,
      turnovers: 3.2,
    },
  },
  {
    playerId: "1628389",
    firstName: "Bam",
    lastName: "Adebayo",
    firstNameLower: "bam",
    lastNameLower: "adebayo",
    fullNameLower: "bam adebayo",
    positions: ["C", "PF"],
    teamId: "14",
    height: "6-9",
    weight: "255",
    jerseyNumber: "13",
    country: "USA",
    headshotURL: "https://cdn.nba.com/headshots/nba/latest/1040x760/1628389.png",
    salary: 11000000,
    gamesPlayed: 36,
    averageStats: {
      assists: 3.8,
      blocks: 1.1,
      fieldGoalPercentage: 0.56,
      fieldGoalsAttempted: 13.5,
      fieldGoalsMade: 7.6,
      freeThrowPercentage: 0.72,
      freeThrowsAttempted: 5.2,
      freeThrowsMade: 3.7,
      minutes: 33.4,
      personalFouls: 2.8,
      points: 18.9,
      rebounds: 10.2,
      steals: 1.2,
      threePointerPercentage: 0.15,
      threePointersAttempted: 0.8,
      threePointersMade: 0.1,
      turnovers: 2.5,
    },
  },
];

export const NBA_PLAYERS: NbaPlayerDoc[] = NBA_PLAYERS_BASE.map((p) => ({
  ...p,
  gamelog: generateMockGamelog(p.averageStats, p.teamId),
}));

export function getPlayersByPosition(position: NbaPlayerDoc["positions"][number]): NbaPlayerDoc[] {
  return NBA_PLAYERS.filter((p) => p.positions.includes(position));
}

/**
 * Returns up to `count` players from the pool, starting from the beginning.
 */
export function getPlayerPool(count: number): NbaPlayerDoc[] {
  return NBA_PLAYERS.slice(0, count);
}
