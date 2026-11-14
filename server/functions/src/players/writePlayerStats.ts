import { admin, FieldValue } from "../shared/admin";
import { commitIfNeeded, type BatchState } from "../shared/batch";
import type { DailyStats } from "./fetchDailyStats";

// Appends each gamelog to its nbaPlayers doc and updates season averages
export const writePlayerStats = async (
  playerGamelogs: DailyStats["playerGamelogs"],
  seasonAvgMap: DailyStats["seasonAvgMap"],
  state: BatchState,
  batchLimit: number,
): Promise<BatchState> => {
  let { batch, opCount } = state;

  // === UPDATE NBA PLAYERS COLLECTION ===
  for (const gamelog of playerGamelogs) {
    const playerQuery = await admin
      .firestore()
      .collection("nbaPlayers")
      .where("playerId", "==", gamelog.playerId)
      .limit(1)
      .get();

    if (playerQuery.empty) {
      console.warn(`Player not found in Firestore for id: ${gamelog.playerId}`);
      continue;
    }

    const playerDocRef = playerQuery.docs[0].ref;

    const updateObj: any = {
      gamelog: FieldValue.arrayUnion(gamelog),
    };

    const latestAvg = seasonAvgMap[String(gamelog.playerId)];
    if (latestAvg) {
      updateObj.averageStats = latestAvg;
    }

    console.log("Writing nbaPlayer update:", {
      docId: playerDocRef.id,
      playerId: gamelog.playerId,
    });

    batch.update(playerDocRef, updateObj);

    opCount++;
    const result = await commitIfNeeded(batch, opCount, batchLimit);
    batch = result.batch;
    opCount = result.count;
  }

  return { batch, opCount };
};
