import type { Firestore } from "firebase-admin/firestore";
import { createTeamDoc } from "../generate/team.js";
import type { TeamDoc } from "../types/firestore.js";

export type UpsertTeamOptions = {
  userId: string;
  teamId: string;
  document?: Partial<Omit<TeamDoc, "id">>;
};

export type SeededTeam = {
  id: string;
  userId: string;
  document: TeamDoc;
};

export const upsertTeam = async (
  db: Firestore,
  options: UpsertTeamOptions,
): Promise<SeededTeam> => {
  const { userId, teamId, document = {} } = options;
  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`User "${userId}" not found.`);
  }

  const teamRef = userRef.collection("teams").doc(teamId);
  const existingTeamSnap = await teamRef.get();
  const existingTeam = existingTeamSnap.exists
    ? (existingTeamSnap.data() as TeamDoc)
    : {};
  const teamDocument = createTeamDoc({
    ...existingTeam,
    ...document,
    id: teamId,
    updatedAt: new Date(),
  });

  await teamRef.set(teamDocument);
  await userRef.update({
    teamId,
    updatedAt: new Date(),
  });

  return {
    id: teamId,
    userId,
    document: teamDocument,
  };
};
