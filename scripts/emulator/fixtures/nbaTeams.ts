import type { Firestore } from "firebase-admin/firestore";

export type NbaTeamFixture = {
  id: string;
  name: string;
  abbreviation: string;
};

export const seedNbaTeams = async (
  db: Firestore,
  teams: readonly NbaTeamFixture[],
): Promise<readonly NbaTeamFixture[]> => {
  const batch = db.batch();
  for (const team of teams) {
    batch.set(db.collection("nbaTeams").doc(team.id), team);
  }
  await batch.commit();
  return teams;
};
