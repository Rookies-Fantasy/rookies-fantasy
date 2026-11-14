import * as functions from "firebase-functions/v1";
import { admin } from "../shared/admin";
import { completeMatchup } from "./completeMatchup";

// Scheduled function that runs every Monday at 2 AM PDT
// Cron format: "minute hour day-of-month month day-of-week"
// "0 2 * * 1" = Every Monday at 2:00 AM
export const weeklyMatchupReset = functions.pubsub
  .schedule("0 2 * * 1")
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    console.log("Starting weekly matchup reset...");

    try {
      const db = admin.firestore();

      const activeMatchupsSnapshot = await db
        .collection("matchups")
        .where("leagueId", "==", null)
        .where("status", "==", "active")
        .get();

      console.log(
        `Found ${activeMatchupsSnapshot.size} active ranked matchups`,
      );

      const matchupUpdates = activeMatchupsSnapshot.docs.map(
        async (matchupDoc) => {
          const completed = await completeMatchup(db, matchupDoc);
          if (completed) {
            console.log(`Matchup ${matchupDoc.id} completed`);
          }
        },
      );

      await Promise.all(matchupUpdates);

      console.log("Weekly matchup reset completed successfully");
    } catch (error) {
      console.error("Error during weekly matchup reset:", error);
      throw error;
    }
  });
