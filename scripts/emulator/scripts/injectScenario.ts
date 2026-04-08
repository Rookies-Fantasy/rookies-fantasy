import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { createAuthUser, createUserDoc } from "../generate/user.js";
import { createTeamDoc } from "../generate/team.js";
import { createMatchupDoc } from "../generate/matchup.js";
import { run as injectNbaTeams } from "./injectNbaTeams.js";
import { run as injectNbaPlayers } from "./injectNbaPlayers.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  await injectNbaTeams(db, auth);
  await injectNbaPlayers(db, auth);

  const password = process.env.USER_PASSWORD ?? "Test1234!";

  // Create two users
  const emailHome = `home@r.test`;
  const emailAway = `away@r.test`;

  const homeUid = await createAuthUser(auth, emailHome, password);
  const awayUid = await createAuthUser(auth, emailAway, password);

  const homeUserDoc = createUserDoc(emailHome, { id: homeUid, emailVerified: true });
  const awayUserDoc = createUserDoc(emailAway, { id: awayUid, emailVerified: true });

  await Promise.all([
    db.collection("users").doc(homeUid).set(homeUserDoc),
    db.collection("users").doc(awayUid).set(awayUserDoc),
  ]);

  // Create a team for each user
  const homeTeamRef = db.collection("users").doc(homeUid).collection("teams").doc();
  const awayTeamRef = db.collection("users").doc(awayUid).collection("teams").doc();

  const homeTeamDoc = createTeamDoc({ id: homeTeamRef.id });
  const awayTeamDoc = createTeamDoc({ id: awayTeamRef.id });

  await Promise.all([
    homeTeamRef.set(homeTeamDoc),
    awayTeamRef.set(awayTeamDoc),
  ]);

  // Create a matchup between them
  const matchupRef = db.collection("matchups").doc();
  const matchupDoc = createMatchupDoc(
    homeUid,
    homeTeamRef.id,
    homeTeamDoc,
    awayUid,
    awayTeamRef.id,
    awayTeamDoc,
    { id: matchupRef.id }
  );

  await matchupRef.set(matchupDoc);

  await Promise.all([
    db.collection("users").doc(homeUid).update({
      queueStatus: "matched",
      currentMatchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(awayUid).update({
      queueStatus: "matched",
      currentMatchupId: matchupDoc.id,
      updatedAt: new Date(),
    }),
    db.collection("users").doc(homeUid).collection("teams").doc(homeTeamRef.id)
      .update({ matchupId: matchupDoc.id, updatedAt: new Date() }),
    db.collection("users").doc(awayUid).collection("teams").doc(awayTeamRef.id)
      .update({ matchupId: matchupDoc.id, updatedAt: new Date() }),
  ]);

  console.log(`Created scenario\n`);
  console.log(`  Home user`);
  console.log(`    UID:      ${homeUid}`);
  console.log(`    Email:    ${emailHome}`);
  console.log(`    Password: ${password}`);
  console.log(`    Team ID:  ${homeTeamRef.id}`);
  console.log(`\n  Away user`);
  console.log(`    UID:      ${awayUid}`);
  console.log(`    Email:    ${emailAway}`);
  console.log(`    Password: ${password}`);
  console.log(`    Team ID:  ${awayTeamRef.id}`);
  console.log(`\n  Matchup ID: ${matchupDoc.id}`);
}
