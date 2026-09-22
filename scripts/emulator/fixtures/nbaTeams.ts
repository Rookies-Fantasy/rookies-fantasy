import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import type { NbaTeam } from "../../../client/types/nbaTeams.js";

export type NbaTeamFixture = NbaTeam;

export const stageNbaTeams = (
  db: Firestore,
  batch: WriteBatch,
  teams: readonly NbaTeamFixture[],
): void => {
  for (const team of teams) {
    batch.set(db.collection("nbaTeams").doc(team.id), team);
  }
};

export const seedNbaTeams = async (
  db: Firestore,
  teams: readonly NbaTeamFixture[],
): Promise<readonly NbaTeamFixture[]> => {
  const batch = db.batch();
  stageNbaTeams(db, batch, teams);
  await batch.commit();
  return teams;
};
