import type { UserRecord } from "firebase-admin/auth";
import * as functions from "firebase-functions/v1";
import { admin } from "./shared/admin";
import { api } from "./shared/balldontlie";
import type { LineupSnapshotItem, TeamSnapshot } from "./shared/types";

export { getLiveData } from "./players/getLiveData";
export { updateDailyPlayerData } from "./players/updateDailyPlayerData";

type Matchup = {
  createdAt: Date;
  id: string;
  weekStart: string;
  homeTeamSnapshot: TeamSnapshot;
  awayTeamSnapshot: TeamSnapshot;
  homeTeamId: string;
  awayTeamId: string;
  homeUserId: string;
  awayUserId: string;
  status: "active" | "completed";
  awayLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  homeLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  awayScore?: number;
  homeScore?: number;
  winnerId?: string;
};

export const createUserInDatabase = functions.auth
  .user()
  .onCreate(async (user: UserRecord) => {
    const { uid, email, emailVerified } = user;
    const usersRef = admin.firestore().collection("users");

    if (!email?.trim()) {
      console.error(`${uid} has invalid or missing email`);
      throw new Error("Email is required for user creation.");
    }

    try {
      await usersRef.doc(uid).set({
        id: uid,
        email: email,
        emailVerified: emailVerified,
        queueStatus: "idle",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating user in Firestore:", error);
    }
  });

export const processQueue = functions
  .runWith({ secrets: ["BALLDONTLIE_URL", "BALLDONTLIE_API_KEY"] })
  .firestore.document("users/{userId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.queueStatus !== "queued" && after.queueStatus === "queued") {
      try {
        await admin.firestore().runTransaction(async (transaction) => {
          const waitingUsers = await transaction.get(
            admin
              .firestore()
              .collection("users")
              .where("queueStatus", "==", "queued")
              .orderBy("queuedAt", "asc")
              .limit(2),
          );

          if (waitingUsers.size >= 2) {
            const [user1, user2] = waitingUsers.docs;

            if (
              user1.data().queueStatus === "queued" &&
              user2.data().queueStatus === "queued"
            ) {
              const teamId1 = user1.data().teamId;
              const teamId2 = user2.data().teamId;

              if (!teamId1 || !teamId2) {
                console.error(
                  `Cannot create matchup: Missing teamId for user1=${teamId1}, user2=${teamId2}`,
                );
                return;
              }

              transaction.update(user1.ref, {
                queueStatus: "matching",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              transaction.update(user2.ref, {
                queueStatus: "matching",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            }
          }
        });

        const waitingUsers = await admin
          .firestore()
          .collection("users")
          .where("queueStatus", "==", "matching")
          .orderBy("queuedAt", "asc")
          .limit(2)
          .get();

        if (waitingUsers.size >= 2) {
          const [user1, user2] = waitingUsers.docs;

          const teamId1 = user1.data().teamId;
          const teamId2 = user2.data().teamId;

          const matchupId = await createWeeklyMatchup(
            user1.id,
            user2.id,
            teamId1,
            teamId2,
          );

          if (!matchupId) {
            console.error("Failed to create matchup, matchupId is undefined");
            await Promise.all([
              user1.ref.update({ queueStatus: "queued" }),
              user2.ref.update({ queueStatus: "queued" }),
            ]);
            return;
          }

          await Promise.all([
            user1.ref.update({
              currentMatchupId: matchupId,
              queueStatus: "matched",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            user2.ref.update({
              currentMatchupId: matchupId,
              queueStatus: "matched",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
          ]);

          console.log(
            `Match created: ${matchupId} between ${user1.id} and ${user2.id}`,
          );
        }

        // TODO: Implement push notifications
      } catch (error) {
        console.error("Error processing queue:", error);
      }
    }
  });

const createWeeklyMatchup = async (
  userId1: string,
  userId2: string,
  teamId1: string,
  teamId2: string,
): Promise<string | undefined> => {
  try {
    const team1Data = await admin
      .firestore()
      .collection("users")
      .doc(userId1)
      .collection("teams")
      .doc(teamId1)
      .get();
    const team2Data = await admin
      .firestore()
      .collection("users")
      .doc(userId2)
      .collection("teams")
      .doc(teamId2)
      .get();

    if (!team1Data.exists || !team2Data.exists) {
      console.error("Team data not found!");
      return undefined;
    }

    const team1Info = team1Data.data();
    const team2Info = team2Data.data();

    if (!team1Info || !team2Info) {
      console.error("Team info is undefined!");
      return undefined;
    }

    const startDate = await getNextMondayDate();
    const matchupRef = admin.firestore().collection("matchups").doc();

    const [team1Augment, team2Augment] = await Promise.all([
      getAugmentSnapshot(team1Info.augmentId),
      getAugmentSnapshot(team2Info.augmentId),
    ]);

    const matchupData: Matchup = {
      id: matchupRef.id,
      createdAt: new Date(),
      weekStart: startDate,
      homeTeamId: teamId1,
      awayTeamId: teamId2,
      homeUserId: userId1,
      awayUserId: userId2,
      awayTeamSnapshot: createTeamSnapshot(team2Info, team2Augment),
      homeTeamSnapshot: createTeamSnapshot(team1Info, team1Augment),
      awayLineupSnapshots: {},
      homeLineupSnapshots: {},
      status: "active",
    };

    await matchupRef.set(matchupData);
    return matchupRef.id;
  } catch (error) {
    console.error("Error creating weekly matchup:", error);
    return undefined;
  }
};

const getAugmentSnapshot = async (augmentId?: string) => {
  if (!augmentId) {
    return undefined;
  }

  const augment = await admin
    .firestore()
    .collection("augments")
    .doc(augmentId)
    .get();

  return augment.exists ? { id: augment.id, ...augment.data() } : undefined;
};

const createTeamSnapshot = (
  teamInfo: any,
  augmentSnapshot?: any,
): TeamSnapshot => ({
  logoUrl: teamInfo.logoUrl,
  name: teamInfo.name,
  record: teamInfo.record,
  ...(augmentSnapshot ? { augmentSnapshot } : {}),
});

const getNextMondayDate = async (): Promise<string> => {
  const today = new Date();
  const dayOfTheWeek = today.getDay();

  if (dayOfTheWeek === 1) {
    const hasMondayGamesStarted = await checkIfMondayGamesStarted();

    if (!hasMondayGamesStarted) {
      return today.toISOString().split("T")[0];
    } else {
      // Move to next Monday
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + 7);
      return nextMonday.toISOString().split("T")[0];
    }
  }

  const daysUntilMonday = dayOfTheWeek === 0 ? 1 : (8 - dayOfTheWeek) % 7;

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split("T")[0];
};

const checkIfMondayGamesStarted = async (): Promise<boolean> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const response = await fetch(
      `${process.env.BALLDONTLIE_URL}/games?dates[]=${todayStr}`,
      {
        headers: {
          Authorization: `${process.env.BALLDONTLIE_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.log("Failed fetch for NBA games");
      return true;
    }

    const data: any = await response.json();
    const games = data.data || [];

    if (games.length === 0) {
      return false;
    }

    const earliestGame = new Date(
      Math.min(...games.map((g: any) => new Date(g.status).getTime())),
    );

    const now = new Date();
    return now >= earliestGame;
  } catch (error) {
    console.log("Error checking NBA games:", error);
    return true;
  }
};

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

type EarliestGameCacheEntry = {
  earliestGameStart: string;
  fetchedAt: number;
};

const earliestGameCache: Record<string, EarliestGameCacheEntry> = {};
const DAY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getEarliestGameStartTime = functions.https.onRequest(
  async (req, res) => {
    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).send("Unauthorized");
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(401).send("Unauthorized");
      return;
    }

    const { date } = req.query;

    if (!date || typeof date !== "string" || !isValidISODate(date)) {
      res.status(400).send("Invalid date. Expected YYYY-MM-DD");
      return;
    }

    const now = Date.now();
    const cached = earliestGameCache[date];

    if (cached && now - cached.fetchedAt < DAY_CACHE_TTL_MS) {
      console.log(`Fetched earliest game time for ${date} from cache`);
      res.json({
        date,
        earliestGameStart: cached.earliestGameStart,
        cached: true,
      });
      return;
    }

    try {
      console.log(`Fetching earliest game time for ${date} from API`);

      const { data } = await api.nba.getGames({
        dates: [date],
      });

      if (!data || data.length === 0) {
        res.status(200).json({ earliestGameStart: null });
        return;
      }

      let earliest: Date | null = null;

      for (const game of data) {
        // Quick type fix by casting to any, as the balldontlie API docs has the attribute listed as "date",
        // but "datetime" is what's actually returned.
        if (!(game as any).datetime) continue;

        const dt = new Date((game as any).datetime);
        if (!earliest || dt < earliest) {
          earliest = dt;
        }
      }

      if (!earliest) {
        res.status(500).send("No valid game times found");
        return;
      }

      // Cache result
      earliestGameCache[date] = {
        earliestGameStart: earliest.toISOString(),
        fetchedAt: now,
      };

      res.json({
        date,
        earliestGameStart: earliest.toISOString(),
        cached: false,
      });
    } catch (err) {
      console.error("Error fetching NBA games:", err);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  },
);

const isValidISODate = (value: string): boolean => {
  // Matches YYYY-MM-DD and ensures it's a real date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !isNaN(date.getTime());
};
