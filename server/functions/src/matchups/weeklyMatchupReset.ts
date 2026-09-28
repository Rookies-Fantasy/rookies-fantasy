import * as functions from "firebase-functions/v1";
import { admin } from "../shared/admin";

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
        .where("status", "==", "active")
        .get();

      console.log(`Found ${activeMatchupsSnapshot.size} active matchups`);

      const matchupUpdates = activeMatchupsSnapshot.docs.map(
        async (matchupDoc) => {
          const matchupData = matchupDoc.data();
          const matchupId = matchupDoc.id;

          let homeTotal = 0;
          let awayTotal = 0;

          for (const day of Object.values(matchupData.homeLineupSnapshots)) {
            for (const player of Object.values(day as any)) {
              homeTotal +=
                (player as any).playerSnapshot?.gameStats?.fantasyPoints ?? 0;
            }
          }

          for (const day of Object.values(matchupData.awayLineupSnapshots)) {
            for (const player of Object.values(day as any)) {
              awayTotal +=
                (player as any).playerSnapshot?.gameStats?.fantasyPoints ?? 0;
            }
          }

          console.log(
            `Matchup ${matchupId}: Home ${homeTotal} vs Away ${awayTotal}`,
          );

          let winnerId: string;
          if (homeTotal > awayTotal) {
            winnerId = matchupData.homeTeamId;
          } else if (awayTotal > homeTotal) {
            winnerId = matchupData.awayTeamId;
          } else {
            winnerId = "";
            console.log(`Matchup ${matchupId} ended in a tie`);
          }

          await matchupDoc.ref.update({
            awayScore: awayTotal,
            homeScore: homeTotal,
            status: "completed",
            winnerId: winnerId,
          });

          console.log(`Matchup ${matchupId} completed. Winner: ${winnerId}`);

          const teams = [
            {
              userId: matchupData.homeUserId,
              teamId: matchupData.homeTeamId,
            },
            {
              userId: matchupData.awayUserId,
              teamId: matchupData.awayTeamId,
            },
          ];

          for (const team of teams) {
            const teamRef = db
              .collection("users")
              .doc(team.userId)
              .collection("teams")
              .doc(team.teamId);

            const teamDoc = await teamRef.get();
            const isWin = winnerId === team.teamId;
            const isDraw = winnerId === "";
            const isLoss = !isWin && !isDraw;

            if (teamDoc.exists) {
              const teamData = teamDoc.data();
              const current = teamData?.record || {
                wins: 0,
                losses: 0,
                draws: 0,
              };
              await teamRef.update({
                record: {
                  wins: isWin ? current.wins + 1 : current.wins,
                  losses: isLoss ? current.losses + 1 : current.losses,
                  draws: isDraw ? current.draws + 1 : current.draws,
                },
              });
            } else {
              await teamRef.set(
                {
                  record: {
                    wins: isWin ? 1 : 0,
                    losses: isLoss ? 1 : 0,
                    draws: isDraw ? 1 : 0,
                  },
                },
                // This merge updates new data to an existing document
                // without overwriting anything other fields
                { merge: true },
              );
            }

            console.log(`Updated record for team ${team.teamId}`);
          }
        },
      );

      await Promise.all(matchupUpdates);

      const matchedUsersSnapshot = await db
        .collection("users")
        .where("queueStatus", "==", "matched")
        .get();

      console.log(`Found ${matchedUsersSnapshot.size} matched users`);

      const userUpdates = matchedUsersSnapshot.docs.map(async (userDoc) => {
        await userDoc.ref.update({
          queueStatus: "idle",
          queuedAt: admin.firestore.FieldValue.delete(),
          currentMatchupId: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Reset user ${userDoc.id} to idle`);
      });

      await Promise.all(userUpdates);

      console.log("Weekly matchup reset completed successfully");
    } catch (error) {
      console.error("Error during weekly matchup reset:", error);
      throw error;
    }
  });
