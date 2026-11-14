import { getLineupSnapshot } from "../scoring/lineupSnapshot";
import { admin } from "../shared/admin";
import { commitIfNeeded, type BatchState } from "../shared/batch";
import { formatDate, getThisMondayString } from "../shared/dates";

// Writes today's lineup snapshots onto every matchup in the current week
export const snapshotDailyLineups = async (
  gamelogMap: Parameters<typeof getLineupSnapshot>[1],
  state: BatchState,
  batchLimit: number,
): Promise<BatchState> => {
  let { batch, opCount } = state;

  // === UPDATE MATCHUPS COLLECTION ===
  const weekStartDate = getThisMondayString();
  const today = formatDate(new Date());
  const matchupSnapshot = await admin
    .firestore()
    .collection("matchups")
    .where("weekStart", "==", weekStartDate)
    .get();

  for (const matchupDoc of matchupSnapshot.docs) {
    const matchupData = matchupDoc.data();

    // Save the current state of the lineups and players to the history. These are immutable snapshots
    const awayAugment = matchupData.awayTeamSnapshot?.augmentSnapshot;
    const homeAugment = matchupData.homeTeamSnapshot?.augmentSnapshot;

    const [homeTeamDoc, awayTeamDoc] = await Promise.all([
      admin
        .firestore()
        .doc(`users/${matchupData.homeUserId}/teams/${matchupData.homeTeamId}`)
        .get(),
      admin
        .firestore()
        .doc(`users/${matchupData.awayUserId}/teams/${matchupData.awayTeamId}`)
        .get(),
    ]);

    const homeLineup = homeTeamDoc.exists ? homeTeamDoc.data()?.lineup : {};
    const awayLineup = awayTeamDoc.exists ? awayTeamDoc.data()?.lineup : {};

    console.log("Processing matchup with augments:", {
      docId: matchupDoc.id,
      awayAugment: awayAugment?.title,
      homeAugment: homeAugment?.title,
    });

    const awayLineupSnapshotsField = `awayLineupSnapshots.${today}`;
    const homeLineupSnapshotsField = `homeLineupSnapshots.${today}`;

    batch.set(
      matchupDoc.ref,
      {
        [awayLineupSnapshotsField]: getLineupSnapshot(
          awayLineup,
          gamelogMap,
          awayAugment,
        ),
        [homeLineupSnapshotsField]: getLineupSnapshot(
          homeLineup,
          gamelogMap,
          homeAugment,
        ),
      },
      { merge: true },
    );

    const result = await commitIfNeeded(batch, opCount, batchLimit);
    batch = result.batch;
    opCount = result.count;
  }

  return { batch, opCount };
};
