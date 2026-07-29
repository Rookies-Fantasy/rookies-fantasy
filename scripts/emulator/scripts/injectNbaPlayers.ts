import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

const PLAYERS = [
  {
    playerId: "2544",
    firstName: "LeBron",
    lastName: "James",
    positions: ["SF", "PF"],
    teamId: "lal",
    teamAbbreviation: "LAL",
    headshotUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png",
    height: "6-9",
    weight: "250",
    jerseyNumber: "23",
    salary: 12000000,
    gamesPlayed: 35,
    averageStats: {
      assists: 6.8,
      blocks: 0.6,
      fantasyPoints: 53.4,
      minutes: 35.2,
      points: 25.3,
      rebounds: 8.1,
      steals: 1.3,
      turnovers: 3.5,
    },
  },
  {
    playerId: "203507",
    firstName: "Giannis",
    lastName: "Antetokounmpo",
    positions: ["PF", "C"],
    teamId: "mil",
    teamAbbreviation: "MIL",
    headshotUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png",
    height: "6-11",
    weight: "243",
    jerseyNumber: "34",
    salary: 15000000,
    gamesPlayed: 38,
    averageStats: {
      assists: 5.8,
      blocks: 1.4,
      fantasyPoints: 61.2,
      minutes: 34.5,
      points: 31.2,
      rebounds: 11.9,
      steals: 1.1,
      turnovers: 3.8,
    },
  },
];

export const run = async (db: Firestore, _auth: Auth): Promise<void> => {
  const batch = db.batch();
  for (const player of PLAYERS) {
    batch.set(db.collection("nbaPlayers").doc(player.playerId), player);
  }
  await batch.commit();
  console.log(`Injected ${PLAYERS.length} NBA players`);
};
