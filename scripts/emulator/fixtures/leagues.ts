import type { Firestore, WriteBatch } from "firebase-admin/firestore";
import { createLeagueDoc } from "../generate/league.js";
import type { LeagueDoc, TeamDoc } from "../types/firestore.js";
import { stageTeam } from "./teams.js";

export type LeagueMember = {
  userId: string;
  teamId: string;
  team: Partial<Omit<TeamDoc, "id">>;
};

export type StageLeagueOptions = {
  leagueId: string;
  creatorUserId: string;
  members: LeagueMember[];
  document?: Partial<
    Omit<LeagueDoc, "creatorUserId" | "memberCount" | "teamIds" | "userIds">
  >;
};

export type CreateLeagueOptions = {
  leagueId: string;
  userId: string;
  teamId: string;
  document?: StageLeagueOptions["document"];
};

export type StagedLeague = {
  document: LeagueDoc;
  teams: TeamDoc[];
};

export type CreateLeagueResult =
  | { created: true; leagueId: string; document: LeagueDoc }
  | { created: false; leagueId: string };

export const stageLeague = (
  db: Firestore,
  batch: WriteBatch,
  options: StageLeagueOptions,
): StagedLeague => {
  const teams = options.members.map((member) =>
    stageTeam(db, batch, {
      userId: member.userId,
      teamId: member.teamId,
      document: { ...member.team, isLeagueTeam: true },
    }),
  );

  const leagueDocument = createLeagueDoc({
    ...options.document,
    creatorUserId: options.creatorUserId,
    teamIds: options.members.map((member) => member.teamId),
    userIds: options.members.map((member) => member.userId),
  });
  batch.set(db.collection("leagues").doc(options.leagueId), leagueDocument);
  return { document: leagueDocument, teams };
};

export const createLeague = async (
  db: Firestore,
  options: CreateLeagueOptions,
): Promise<CreateLeagueResult> => {
  const userRef = db.collection("users").doc(options.userId);
  const leagueRef = db.collection("leagues").doc(options.leagueId);
  const [userSnap, leagueSnap] = await Promise.all([
    userRef.get(),
    leagueRef.get(),
  ]);

  if (!userSnap.exists) {
    throw new Error(`User "${options.userId}" not found.`);
  }
  if (leagueSnap.exists) {
    return { created: false, leagueId: options.leagueId };
  }

  const batch = db.batch();
  const { document } = stageLeague(db, batch, {
    leagueId: options.leagueId,
    creatorUserId: options.userId,
    members: [{ userId: options.userId, teamId: options.teamId, team: {} }],
    document: options.document,
  });
  await batch.commit();

  return { created: true, leagueId: options.leagueId, document };
};
