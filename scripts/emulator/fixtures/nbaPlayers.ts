import type { Firestore } from "firebase-admin/firestore";
import type { SlotPosition } from "../../../client/types/team.js";

export type NbaPlayerFixture = {
  playerId: string;
  firstName: string;
  lastName: string;
  positions: SlotPosition[];
  teamId: string;
  teamAbbreviation: string;
  headshotUrl: string;
  height: string;
  weight: string;
  jerseyNumber: string;
  salary: number;
  gamesPlayed: number;
  averageStats: {
    assists: number;
    blocks: number;
    fantasyPoints: number;
    minutes: number;
    points: number;
    rebounds: number;
    steals: number;
    turnovers: number;
  };
};

export const seedNbaPlayers = async (
  db: Firestore,
  players: readonly NbaPlayerFixture[],
): Promise<readonly NbaPlayerFixture[]> => {
  const batch = db.batch();
  for (const player of players) {
    batch.set(db.collection("nbaPlayers").doc(player.playerId), player);
  }
  await batch.commit();
  return players;
};
