import { FieldValue, type Firestore } from "firebase-admin/firestore";

export const DELETED_USER_STATUS = "deleted";
export const DELETED_USERNAME = "Deleted user";

type LeagueMembership = {
  memberCount?: number;
  teamIds?: string[];
  userIds?: string[];
};

export type LeagueRemovalResult = "removed" | "deleted" | "skipped";

// Removes a deleted user and their teams from one league. The league is
// deleted when nobody is left in it, so empty leagues don't linger.
// Runs in a transaction and recomputes `memberCount` from `userIds`, so a
// retry can't decrement it twice.
export const removeUserFromLeague = (
  db: Firestore,
  leagueId: string,
  uid: string,
  teamIds: string[],
): Promise<LeagueRemovalResult> =>
  db.runTransaction(async (transaction) => {
    const leagueRef = db.collection("leagues").doc(leagueId);
    const leagueDoc = await transaction.get(leagueRef);
    if (!leagueDoc.exists) {
      return "skipped";
    }

    const league = leagueDoc.data() as LeagueMembership;
    const userIds = league.userIds ?? [];
    if (!userIds.includes(uid)) {
      return "skipped";
    }

    const remainingUserIds = userIds.filter((id) => id !== uid);
    if (remainingUserIds.length === 0) {
      transaction.delete(leagueRef);
      return "deleted";
    }

    const remainingTeamIds = (league.teamIds ?? []).filter(
      (id) => !teamIds.includes(id),
    );
    transaction.update(leagueRef, {
      userIds: remainingUserIds,
      teamIds: remainingTeamIds,
      memberCount: remainingUserIds.length,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "removed";
  });

// Flags the user document as deleted and strips its personal data.
// The document and the user's teams are kept so matchups, records and league
// history still point at real documents. What remains is anonymous gameplay
// data, which keeps this compliant with App Store guideline 5.1.1(v).
export const anonymizeUserDocument = async (
  db: Firestore,
  uid: string,
): Promise<boolean> => {
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    return false;
  }

  await userRef.update({
    status: DELETED_USER_STATUS,
    deletedAt: FieldValue.serverTimestamp(),
    username: DELETED_USERNAME,
    email: FieldValue.delete(),
    emailVerified: FieldValue.delete(),
    dateOfBirth: FieldValue.delete(),
    avatarUrl: FieldValue.delete(),
    queueStatus: "idle",
    queuedAt: FieldValue.delete(),
    currentMatchupId: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return true;
};

// Cleans up after a Firebase Auth account is deleted: removes the user from
// their leagues (deleting leagues left empty) and anonymizes their profile.
export const cleanUpDeletedUser = async (db: Firestore, uid: string) => {
  const teamsSnapshot = await db
    .collection("users")
    .doc(uid)
    .collection("teams")
    .get();
  const teamIds = teamsSnapshot.docs.map((teamDoc) => teamDoc.id);

  const leaguesSnapshot = await db
    .collection("leagues")
    .where("userIds", "array-contains", uid)
    .get();

  const leagueResults = await Promise.all(
    leaguesSnapshot.docs.map((leagueDoc) =>
      removeUserFromLeague(db, leagueDoc.id, uid, teamIds),
    ),
  );

  const anonymized = await anonymizeUserDocument(db, uid);

  return {
    anonymized,
    leaguesRemovedFrom: leagueResults.filter((r) => r === "removed").length,
    leaguesDeleted: leagueResults.filter((r) => r === "deleted").length,
  };
};
