import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { createMatchupDoc } from "../generate/matchup.js";
import type { TeamDoc } from "../types/firestore.js";

export async function run(db: Firestore, _auth: Auth): Promise<void> {
  const homeUserId = process.env.HOME_USER_ID;
  const homeTeamId = process.env.HOME_TEAM_ID;
  const awayUserId = process.env.AWAY_USER_ID;
  const awayTeamId = process.env.AWAY_TEAM_ID;

  if (!homeUserId || !homeTeamId || !awayUserId || !awayTeamId) {
    throw new Error(
      "Required env vars: HOME_USER_ID, HOME_TEAM_ID, AWAY_USER_ID, AWAY_TEAM_ID.\n" +
        "Run seed:user twice and seed:team twice to get the required IDs."
    );
  }

  // Dependency check: both user documents must exist.
  const [homeUserSnap, awayUserSnap] = await Promise.all([
    db.collection("users").doc(homeUserId).get(),
    db.collection("users").doc(awayUserId).get(),
  ]);
  if (!homeUserSnap.exists) {
    throw new Error(`Home user "${homeUserId}" not found in Firestore. Run seed:user first.`);
  }
  if (!awayUserSnap.exists) {
    throw new Error(`Away user "${awayUserId}" not found in Firestore. Run seed:user first.`);
  }

  // Dependency check: both team documents must exist under their respective users.
  const [homeTeamSnap, awayTeamSnap] = await Promise.all([
    db.collection("users").doc(homeUserId).collection("teams").doc(homeTeamId).get(),
    db.collection("users").doc(awayUserId).collection("teams").doc(awayTeamId).get(),
  ]);
  if (!homeTeamSnap.exists) {
    throw new Error(
      `Home team "${homeTeamId}" not found under user "${homeUserId}". Run seed:team with USER_ID=${homeUserId} first.`
    );
  }
  if (!awayTeamSnap.exists) {
    throw new Error(
      `Away team "${awayTeamId}" not found under user "${awayUserId}". Run seed:team with USER_ID=${awayUserId} first.`
    );
  }

  const homeTeam = homeTeamSnap.data() as TeamDoc;
  const awayTeam = awayTeamSnap.data() as TeamDoc;

  const matchupRef = db.collection("matchups").doc();
  const matchupDoc = createMatchupDoc(
    homeUserId,
    homeTeamId,
    homeTeam,
    awayUserId,
    awayTeamId,
    awayTeam,
    { id: matchupRef.id }
  );

  // Write matchup document.
  await matchupRef.set(matchupDoc);

  // Update both users with matched status and currentMatchupId.
  await Promise.all([
    db.collection("users").doc(homeUserId).update({
      queueStatus: "matched",
      currentMatchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(awayUserId).update({
      queueStatus: "matched",
      currentMatchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
  ]);

  // Update both teams with matchupId.
  await Promise.all([
    db
      .collection("users")
      .doc(homeUserId)
      .collection("teams")
      .doc(homeTeamId)
      .update({ matchupId: matchupDoc.id, updatedAt: new Date() }),
    db
      .collection("users")
      .doc(awayUserId)
      .collection("teams")
      .doc(awayTeamId)
      .update({ matchupId: matchupDoc.id, updatedAt: new Date() }),
  ]);

  console.log(`Created matchup`);
  console.log(`  Matchup ID:    ${matchupDoc.id}`);
  console.log(`  Week Start:    ${matchupDoc.weekStartDate}`);
  console.log(`  Home user/team: ${homeUserId} / ${homeTeamId}`);
  console.log(`  Away user/team: ${awayUserId} / ${awayTeamId}`);
}
