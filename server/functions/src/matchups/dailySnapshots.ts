import { DocumentData, Firestore } from "firebase-admin/firestore";

export type DailyScoringTarget = {
  // The date the scored games were played (PT).
  gameDate: string;
  // The Monday of the matchup week containing gameDate.
  weekStart: string;
};

export type BuildLineupSnapshot = (
  lineup: DocumentData[] | null,
  augment: DocumentData | null,
) => DocumentData[];

const BATCH_LIMIT = 400;

// Writes one day's lineup snapshots to every active matchup in the week that
// contains the game date. Snapshots are keyed by the game date.
export const writeDailyMatchupSnapshots = async (
  db: Firestore,
  { gameDate, weekStart }: DailyScoringTarget,
  buildLineupSnapshot: BuildLineupSnapshot,
): Promise<string[]> => {
  const matchups = await db
    .collection("matchups")
    .where("weekStart", "==", weekStart)
    .get();

  const updatedIds: string[] = [];
  let batch = db.batch();
  let pending = 0;

  for (const matchupDoc of matchups.docs) {
    const matchup = matchupDoc.data();
    if (matchup.status !== "active") continue;

    const [homeTeamDoc, awayTeamDoc] = await Promise.all([
      db.doc(`users/${matchup.homeUserId}/teams/${matchup.homeTeamId}`).get(),
      db.doc(`users/${matchup.awayUserId}/teams/${matchup.awayTeamId}`).get(),
    ]);

    console.log("Processing matchup with augments:", {
      docId: matchupDoc.id,
      gameDate,
      awayAugment: matchup.awayTeamSnapshot?.augmentSnapshot?.title,
      homeAugment: matchup.homeTeamSnapshot?.augmentSnapshot?.title,
    });

    // update() treats the dotted key as a nested path; set() would write a
    // literal top-level field named "homeLineupSnapshots.<date>".
    batch.update(matchupDoc.ref, {
      [`homeLineupSnapshots.${gameDate}`]: buildLineupSnapshot(
        homeTeamDoc.data()?.lineup ?? null,
        matchup.homeTeamSnapshot?.augmentSnapshot ?? null,
      ),
      [`awayLineupSnapshots.${gameDate}`]: buildLineupSnapshot(
        awayTeamDoc.data()?.lineup ?? null,
        matchup.awayTeamSnapshot?.augmentSnapshot ?? null,
      ),
    });
    updatedIds.push(matchupDoc.id);
    pending++;

    if (pending >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
  }

  return updatedIds;
};
