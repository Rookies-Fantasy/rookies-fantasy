import * as functions from "firebase-functions/v1";
import { snapshotDailyLineups } from "../matchups/snapshotDailyLineups";
import { admin } from "../shared/admin";
import type { BatchState } from "../shared/batch";
import { fetchDailyStats } from "./fetchDailyStats";
import { writePlayerStats } from "./writePlayerStats";

export const updateDailyPlayerData = functions
  .runWith({ secrets: ["BALLDONTLIE_API_KEY"] })
  .pubsub.schedule("0 1 * * *") // runs every day at 1:00 AM PDT
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    const { playerGamelogs, seasonAvgMap, gamelogMap } =
      await fetchDailyStats();

    // Initialize batching
    const BATCH_LIMIT = 400;
    let state: BatchState = { batch: admin.firestore().batch(), opCount: 0 };

    state = await writePlayerStats(
      playerGamelogs,
      seasonAvgMap,
      state,
      BATCH_LIMIT,
    );
    state = await snapshotDailyLineups(gamelogMap, state, BATCH_LIMIT);

    const { batch, opCount } = state;
    if (opCount > 0) {
      console.log("Final commit with remaining operations:", opCount);
      try {
        await batch.commit();
        console.log("Final batch commit SUCCESS");
      } catch (err) {
        console.error("Final batch commit FAILED:", err);
      }
    }

    console.log("=== Finished updateDailyPlayerData job ===");
  });
