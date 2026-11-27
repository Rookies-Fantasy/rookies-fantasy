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
    Omit<
      LeagueDoc,
      "creatorUserId" | "memberCount" | "teamIds" | "userIds" | "teamOwners"
    >
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
    teamOwners: Object.fromEntries(
      options.members.map((member) => [member.teamId, member.userId]),
    ),
  });
  batch.set(db.collection("leagues").doc(options.leagueId), leagueDocument);
  return { document: leagueDocument, teams };
};

export type StageOrphanTeamDeletesOptions = {
  resetLeagueIds: string[];
  userIds: string[];
  keepTeamIds: Set<string>;
};

// Deletes league teams that no league outside resetLeagueIds references,
// including teams left behind when a join fails after the team is created.
export const stageOrphanLeagueTeamDeletes = async (
  db: Firestore,
  batch: WriteBatch,
  options: StageOrphanTeamDeletesOptions,
): Promise<void> => {
  const resetLeagueIds = new Set(options.resetLeagueIds);
  const referencedTeamIds = new Set(options.keepTeamIds);
  const userIds = new Set(options.userIds);

  const leagues = await db.collection("leagues").get();
  leagues.forEach((league) => {
    const { teamIds = [], userIds: memberIds = [] }: Partial<LeagueDoc> =
      league.data();
    if (resetLeagueIds.has(league.id)) {
      memberIds.forEach((id) => userIds.add(id));
    } else {
      teamIds.forEach((id) => referencedTeamIds.add(id));
    }
  });

  const teamSnaps = await Promise.all(
    [...userIds].map((userId) =>
      db
        .collection("users")
        .doc(userId)
        .collection("teams")
        .where("isLeagueTeam", "==", true)
        .get(),
    ),
  );
  teamSnaps
    .flatMap((snap) => snap.docs)
    .filter((team) => !referencedTeamIds.has(team.id))
    .forEach((team) => batch.delete(team.ref));
};

export const createLeague = async (
  db: Firestore,
  options: CreateLeagueOptions,
): Promise<CreateLeagueResult> => {
  const userRef = db.collection("users").doc(options.userId);
  const leagueRef = db.collection("leagues").doc(options.leagueId);
  const teamRef = userRef.collection("teams").doc(options.teamId);
  const [userSnap, leagueSnap, teamSnap] = await Promise.all([
    userRef.get(),
    leagueRef.get(),
    teamRef.get(),
  ]);

  if (!userSnap.exists) {
    throw new Error(`User "${options.userId}" not found.`);
  }
  if (leagueSnap.exists) {
    return { created: false, leagueId: options.leagueId };
  }
  if (teamSnap.exists) {
    throw new Error(
      `Team "${options.teamId}" already exists for user "${options.userId}". Use a new LEAGUE_TEAM_ID or omit it.`,
    );
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
