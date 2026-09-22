import type { Firestore, WriteBatch } from "firebase-admin/firestore";
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

export const stageNbaPlayers = (
  db: Firestore,
  batch: WriteBatch,
  players: readonly NbaPlayerFixture[],
): void => {
  for (const player of players) {
    batch.set(db.collection("nbaPlayers").doc(player.playerId), {
      ...player,
      firstNameLower: player.firstName.toLowerCase(),
      lastNameLower: player.lastName.toLowerCase(),
      fullNameLower: `${player.firstName} ${player.lastName}`.toLowerCase(),
    });
  }
};

export const seedNbaPlayers = async (
  db: Firestore,
  players: readonly NbaPlayerFixture[],
): Promise<readonly NbaPlayerFixture[]> => {
  const batch = db.batch();
  stageNbaPlayers(db, batch, players);
  await batch.commit();
  return players;
};
