import type { UserRecord } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

admin.initializeApp();

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
  .runWith({ secrets: ["BALLDONTLIE_GAMES_URL", "BALLDONTLIE_API_KEY"] })
  .firestore.document("users/{userId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only trigger if queueStatus changed to "queued"
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

            // Double check they're still queued
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

              const matchupId = await createWeeklyMatchup(
                user1.id,
                user2.id,
                teamId1,
                teamId2,
              );

              if (!matchupId) {
                console.error(
                  "Failed to create matchup, matchupId is undefined",
                );
                return;
              }

              transaction.update(user1.ref, {
                queueStatus: "matched",
                currentMatchupId: matchupId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              transaction.update(user2.ref, {
                queueStatus: "matched",
                currentMatchupId: matchupId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

              console.log(
                `Match created: ${matchupId} between ${user1.id} and ${user2.id}`,
              );
            }
          }
        });

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

    const startDate = await getNextSundayDate();
    const matchupRef = admin.firestore().collection("matchups").doc();

    const matchupData: any = {
      id: matchupRef.id,
      createdAt: new Date(),
      status: "active",
      weekStartDate: startDate,
      homeUserId: userId1,
      awayUserId: userId2,
    };

    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split("T")[0];

      matchupData[dateStr] = {
        homeTeam: {
          id: teamId1,
          score: 0,
          lineup: team1Info.lineup || [],
          qualifyingPlayers: team1Info.lineup || [],
          metadata: {},
        },
        awayTeam: {
          id: teamId2,
          score: 0,
          lineup: team2Info.lineup || [],
          qualifyingPlayers: team2Info.lineup || [],
          metadata: {},
        },
      };
    }

    await matchupRef.set(matchupData);
    return matchupRef.id;
  } catch (error) {
    console.error("Error creating weekly matchup:", error);
    return undefined;
  }
};

const getNextSundayDate = async (): Promise<string> => {
  const today = new Date();
  const dayOfTheWeek = today.getDay();

  if (dayOfTheWeek === 0) {
    const hasGamesStarted = await checkIfSundayGamesStarted();

    if (!hasGamesStarted) {
      return today.toISOString().split("T")[0];
    } else {
      const nextSunday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return nextSunday.toISOString().split("T")[0];
    }
  }

  const daysUntilSunday = 7 - dayOfTheWeek;

  const nextSunday = new Date(
    today.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000,
  );
  return nextSunday.toISOString().split("T")[0];
};

const checkIfSundayGamesStarted = async (): Promise<boolean> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const response = await fetch(
      `${process.env.BALLDONTLIE_GAMES_URL}${todayStr}`,
      {
        headers: {
          Authorization: `${process.env.BALLDONTLIE_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.log("Failed fetch for NBA games");
      return true; // Default to true (games started) to use next Sunday
    }

    const data: any = await response.json();
    const games = data.data || [];

    if (games.length === 0) {
      return false;
    }

    const gameTimes = games.map((game: any) => new Date(game.status));
    const earliestGame = new Date(
      Math.min(...gameTimes.map((d: any) => d.getTime())),
    );

    const now = new Date();
    return now >= earliestGame;
  } catch (error) {
    console.log("Error checking NBA games:", error);
    return true;
  }
};
