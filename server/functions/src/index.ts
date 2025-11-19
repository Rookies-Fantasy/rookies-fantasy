import type { UserRecord } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { BalldontlieAPI } from "@balldontlie/sdk";

admin.initializeApp();

type GameInfo = {
  gameStatus: boolean;
  opponent: string;
  gameDate: string;
  isHome: boolean;
};

type GameStats = {
  pts: number;
  ast: number;
  reb: number;
  stl: number;
  blk: number;
  tov: number;
  fpts: number;
  min: number;
};

type LiveData = Record<
  number,
  {
    gameInfo: GameInfo;
    gameStats: GameStats;
  }
>;

const apiKey = process.env.BALLDONTLIE_API_KEY || "";
const api = new BalldontlieAPI({ apiKey });
const cachedData: LiveData = {};
let lastFetchTime = 0;
const CACHE_EXPIRY_MS = 60 * 1000;

const getPlayersFromCache = (
  playerIds: number[],
): Record<number, LiveData | null> => {
  const result: Record<number, LiveData | null> = {};

  for (const id of playerIds) {
    result[id] = cachedData[id] ?? null;
  }

  return result;
};

export const getLiveData = functions.https.onRequest(async (req, res) => {
  // Verify Firebase ID token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).send("Unauthorized: Missing or invalid token");
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying ID token:", error);
    res.status(401).send("Unauthorized: Invalid token");
    return;
  }

  const now = Date.now();

  const { playerIds } = req.body;

  if (!Array.isArray(playerIds)) {
    res.status(400).send("Invalid request");
    return;
  }

  try {
    if (cachedData && now - lastFetchTime < CACHE_EXPIRY_MS) {
      console.log("Serving from cache");
      res.json(getPlayersFromCache(playerIds));
      return;
    }

    console.log("Fetching fresh data from API...");
    const { data } = await api.nba.getLiveBoxScores();

    for (const game of data) {
      const homeTeam = game.home_team as any;
      const awayTeam = game.visitor_team as any;

      for (const player of homeTeam.players) {
        const gameInfo: GameInfo = {
          gameStatus: game.status !== "Final" ? false : true,
          opponent: awayTeam.full_name,
          gameDate: game.date,
          isHome: true,
        };
        cachedData[player.player.id] = {
          gameInfo,
          gameStats: {
            pts: player.pts ?? 0,
            ast: player.ast ?? 0,
            reb: player.reb ?? 0,
            stl: player.stl ?? 0,
            blk: player.blk ?? 0,
            tov: player.turnover ?? 0,
            fpts: player.fpts ?? 0,
            min: parseInt(player.min, 10) || 0,
          },
        };
      }

      for (const player of awayTeam.players) {
        const gameInfo: GameInfo = {
          gameStatus: game.status !== "Final" ? false : true,
          opponent: homeTeam.full_name,
          gameDate: game.date,
          isHome: false,
        };
        cachedData[player.player.id] = {
          gameInfo,
          gameStats: {
            pts: player.pts ?? 0,
            ast: player.ast ?? 0,
            reb: player.reb ?? 0,
            stl: player.stl ?? 0,
            blk: player.blk ?? 0,
            tov: player.turnover ?? 0,
            fpts: player.fpts ?? 0,
            min: parseInt(player.min, 10) || 0,
          },
        };
      }
    }

    res.json(getPlayersFromCache(playerIds));
    lastFetchTime = now;
    return;
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: err });
  }
});

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

export const updateDailyPlayerData = functions
  .runWith({ secrets: ["BALLDONTLIE_API_KEY"] })
  .pubsub.schedule("0 2 * * *") // runs every day at 2:00 AM PDT
  .timeZone("America/Los_Angeles")
  .onRun(async () => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;

    const now = new Date();
    const pacificNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
    );

    // ===================================
    // ====== FETCH SEASON AVERAGES ======
    // ===================================
    const month = pacificNow.getMonth() + 1; // 1–12
    let seasonYear: number;

    // If month >= July (7), season starts that year.
    // Otherwise it's still the previous year's season.
    if (month >= 7) {
      seasonYear = pacificNow.getFullYear();
    } else {
      seasonYear = pacificNow.getFullYear() - 1;
    }

    const seasonUrl = `https://api.balldontlie.io/nba/v1/season_averages/general?season=${seasonYear}&season_type=regular&type=base`;
    const seasonResponse = await fetch(seasonUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!seasonResponse.ok) {
      console.error(
        "Failed season averages fetch:",
        seasonResponse.status,
        seasonResponse.statusText,
      );
      return;
    }

    const seasonData: any = await seasonResponse.json();

    if (!seasonData.data || !Array.isArray(seasonData.data)) {
      console.error("Unexpected Season API format:", seasonData);
      return;
    }

    const seasonAverages = seasonData.data.map((entry: any) => {
      const s = entry.stats;
      const p = entry.player;

      return {
        assists: s.ast,
        blocks: s.blk,
        fantasyPoints: calculateFantasyPoints(s),
        fieldGoalPercentage: s.fgm / s.fga || null,
        fieldGoalsAttempted: s.fga,
        fieldGoalsMade: s.fgm,
        firstName: p.first_name,
        freeThrowPercentage: s.ftm / s.fta || null,
        freeThrowsAttempted: s.fta,
        freeThrowsMade: s.ftm,
        gamesPlayed: s.gp,
        lastName: p.last_name,
        minutes: s.min,
        playerId: p.id,
        points: s.pts,
        rebounds: s.reb,
        steals: s.stl,
        threePointerPercentage: s.fg3m / s.fg3a || null,
        threePointersAttempted: s.fg3a,
        threePointersMade: s.fg3m,
        turnovers: s.tov,
      };
    });

    // =======================================
    // ====== FETCH DAILY GAMELOG STATS ======
    // =======================================
    // Subtract 1 day to get "yesterday" in PDT
    pacificNow.setDate(pacificNow.getDate() - 1);

    const yyyy = pacificNow.getFullYear();
    const mm = String(pacificNow.getMonth() + 1).padStart(2, "0");
    const dd = String(pacificNow.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const gamelogUrl = `https://api.balldontlie.io/v1/stats?dates[]=${formattedDate}`;
    const gamelogResponse = await fetch(gamelogUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!gamelogResponse.ok) {
      console.error(
        "Failed to fetch gamelog stats:",
        gamelogResponse.status,
        gamelogResponse.statusText,
      );
      return;
    }

    const gamelogData: any = await gamelogResponse.json();

    if (!gamelogData.data || !Array.isArray(gamelogData.data)) {
      console.error("Unexpected API gamelogResponse format:", gamelogData);
      return;
    }

    const playerGamelogs = gamelogData.data.map((gamelog: any) => ({
      assists: gamelog.ast,
      blocks: gamelog.blk,
      date: gamelog.game.date,
      fantasyPoints: calculateFantasyPoints(gamelog),
      fieldGoalPercentage: gamelog.fgm / gamelog.fga || null,
      fieldGoalsAttempted: gamelog.fga,
      fieldGoalsMade: gamelog.fgm,
      firstName: gamelog.player.first_name,
      freeThrowPerfectange: gamelog.ftm / gamelog.fta || null,
      freeThrowsAttempted: gamelog.fta,
      freeThrowsMade: gamelog.ftm,
      gameId: gamelog.game.id,
      homeTeamId: gamelog.game.home_team_id,
      lastName: gamelog.player.last_name,
      minutes: gamelog.min,
      personalFouls: gamelog.pf,
      playerId: gamelog.player.id,
      points: gamelog.pts,
      rebounds: gamelog.reb,
      steals: gamelog.stl,
      teamId: gamelog.team.id,
      teamName: gamelog.team.full_name,
      threePointerPercentage: gamelog.fg3m / gamelog.fg3a || null,
      threePointersAttempted: gamelog.fg3a,
      threePointersMade: gamelog.fg3m,
      turnovers: gamelog.turnover,
      visitorTeamId: gamelog.game.visitor_team_id,
    }));

    // Initialize batching
    let batch = admin.firestore().batch();
    let opCount = 0;
    const BATCH_LIMIT = 400;

    const seasonAvgMap: Record<string, any> = {};
    for (const avg of seasonAverages) {
      seasonAvgMap[String(avg.playerId)] = avg;
    }

    const gamelogMap: Record<string, any> = {};
    for (const gamelog of playerGamelogs) {
      gamelogMap[String(gamelog.playerId)] = gamelog;
    }

    // === UPDATE NBA PLAYERS COLLECTION ===
    for (const gamelog of playerGamelogs) {
      const playerQuery = await admin
        .firestore()
        .collection("nbaPlayers")
        .where("playerId", "==", gamelog.playerId)
        .limit(1)
        .get();

      if (playerQuery.empty) {
        console.warn(
          `Player not found in Firestore for id: ${gamelog.playerId}`,
        );
        continue;
      }

      const playerDocRef = playerQuery.docs[0].ref;

      const updateObj: any = {
        gamelog: admin.firestore.FieldValue.arrayUnion(gamelog),
      };

      const latestAvg = seasonAvgMap[String(gamelog.playerId)];
      if (latestAvg) {
        updateObj.averageStats = latestAvg;
      }

      batch.update(playerDocRef, updateObj);

      opCount++;
      opCount = await commitIfNeeded(batch, opCount, BATCH_LIMIT);
    }

    // === UPDATE USERS COLLECTION ===
    const userSnapshot = await admin.firestore().collection("users").get();

    for (const userDoc of userSnapshot.docs) {
      const teamsRef = userDoc.ref.collection("teams");
      const teamSnapshot = await teamsRef.get();

      for (const teamDoc of teamSnapshot.docs) {
        const teamData = teamDoc.data();
        if (!Array.isArray(teamData.lineup)) continue;

        const updatedLineup = teamData.lineup.map((slot: any) => {
          if (!slot || !slot.player) return slot;

          const playerId = String(slot.player.id);
          const latestAvg = seasonAvgMap[playerId];
          const latestGamelog = gamelogMap[playerId];

          if (!latestAvg && !latestGamelog) return slot;

          return {
            ...slot,
            player: {
              ...slot.player,
              ...(latestAvg ? { averageStats: latestAvg } : {}),
              ...(latestGamelog
                ? {
                    gamelog: [
                      ...(Array.isArray(slot.player.gamelog)
                        ? slot.player.gamelog
                        : []),
                      latestGamelog,
                    ],
                  }
                : {}),
            },
          };
        });

        batch.set(teamDoc.ref, { lineup: updatedLineup }, { merge: true });
        opCount = await commitIfNeeded(batch, opCount, BATCH_LIMIT);
      }
    }

    // === UPDATE MATCHUPS COLLECTION ===
    const today = formatDate(new Date());
    const matchupSnapshot = await admin
      .firestore()
      .collection("matchups")
      .get();

    for (const matchupDoc of matchupSnapshot.docs) {
      const matchupData = matchupDoc.data();
      if (!matchupData[today]) continue;

      const dayObj = matchupData[today];

      const updatedDayObj = {
        awayTeam: updateTeamLineup(dayObj.awayTeam, seasonAvgMap, gamelogMap),
        homeTeam: updateTeamLineup(dayObj.homeTeam, seasonAvgMap, gamelogMap),
      };

      batch.set(matchupDoc.ref, { [today]: updatedDayObj }, { merge: true });

      opCount = await commitIfNeeded(batch, opCount, BATCH_LIMIT);
    }

    // Final batch commit
    if (opCount > 0) await batch.commit();
  });

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const updateTeamLineup = (
  team: any,
  avgMap: Record<string, any>,
  gamelogMap: Record<string, any>,
) => {
  if (!team || !Array.isArray(team.lineup)) return team;

  return {
    ...team,
    lineup: team.lineup.map((slot: any) => {
      if (!slot || !slot.player) return slot;

      const playerId = String(slot.player.id);
      const latestAvg = avgMap[playerId];
      const latestGamelog = gamelogMap[playerId];

      if (!latestAvg && !latestGamelog) return slot;

      return {
        ...slot,
        player: {
          ...slot.player,
          ...(latestAvg ? { averageStats: latestAvg } : {}),
          ...(latestGamelog
            ? {
                gamelog: [
                  ...(Array.isArray(slot.player.gamelog)
                    ? slot.player.gamelog
                    : []),
                  latestGamelog,
                ],
              }
            : {}),
        },
      };
    }),
  };
};

const commitIfNeeded = async (
  batch: FirebaseFirestore.WriteBatch,
  count: number,
  limit: number,
) => {
  if (count >= limit) {
    await batch.commit();
    console.log("Committed batch of 400 writes");
    return 0;
  }
  return count + 1;
};

const calculateFantasyPoints = (s: any) => {
  const pts = s.pts * 1;
  const reb = s.reb * 1;
  const ast = s.ast * 2;
  const stl = s.stl * 4;
  const blk = s.blk * 4;
  const fgm = s.fgm * 2;
  const ftm = s.ftm * 1;
  const tpm = s.fg3m * 1;
  const tov = s.tov * -2;

  const fgMiss = (s.fga - s.fgm) * -1;
  const ftMiss = (s.fta - s.ftm) * -1;

  return pts + reb + ast + stl + blk + fgm + ftm + tpm + tov + fgMiss + ftMiss;
};

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
              queueStatus: "matched",
              currentMatchupId: matchupId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            user2.ref.update({
              queueStatus: "matched",
              currentMatchupId: matchupId,
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

    const matchupData: any = {
      id: matchupRef.id,
      createdAt: new Date(),
      status: "active",
      weekStartDate: startDate,
      away: {
        awayAugment: team2Info.augment,
        awayTeamId: teamId2,
        awayTeamLogo: team2Info.logoUrl,
        awayTeamName: team2Info.name,
        awayUserId: userId2,
        awayWeeklyAcquisitionsUsed: 4,
      },
      home: {
        homeAugment: team1Info.augment,
        homeTeamId: teamId1,
        homeTeamLogo: team1Info.logoUrl,
        homeTeamName: team1Info.name,
        homeUserId: userId1,
        homeWeeklyAcquisitionsUsed: 4,
      },
    };

    const weekGamesMap = await fetchWeekGamesInfo(startDate);

    const [year, month, day] = startDate.split("-").map(Number);
    for (let i = 0; i < 7; i++) {
      const date = new Date(year, month - 1, day + i);
      const dateStr = date.toISOString().split("T")[0];

      const dailyGamesMap = weekGamesMap.get(dateStr) || new Map();

      matchupData[dateStr] = {
        homeTeam: {
          score: 0,
          lineup: fillLineupWithGameData(
            team1Info.lineup || [],
            dateStr,
            dailyGamesMap,
          ),
        },
        awayTeam: {
          score: 0,
          lineup: fillLineupWithGameData(
            team2Info.lineup || [],
            dateStr,
            dailyGamesMap,
          ),
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

const fetchWeekGamesInfo = async (
  startDate: string,
): Promise<Map<string, Map<string, any>>> => {
  try {
    const weekGamesMap = new Map<string, Map<string, any>>();

    const [year, month, day] = startDate.split("-").map(Number);
    const endDateObj = new Date(year, month - 1, day + 6);
    const endDate = endDateObj.toISOString().split("T")[0];

    const response = await fetch(
      `${process.env.BALLDONTLIE_URL}/games?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
          Authorization: `${process.env.BALLDONTLIE_API_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.log(`Failed to fetch games for week ${startDate} to ${endDate}`);
      return weekGamesMap;
    }

    const data: any = await response.json();
    const games = data.data || [];

    games.forEach((game: any) => {
      const gameDate = game.date.split("T")[0];

      if (!weekGamesMap.has(gameDate)) {
        weekGamesMap.set(gameDate, new Map());
      }

      const dailyGamesMap = weekGamesMap.get(gameDate);
      if (dailyGamesMap) {
        dailyGamesMap.set(game.home_team.id.toString(), {
          gameStatus: game.status,
          opponent: game.visitor_team.abbreviation,
          gameDate: gameDate,
          isHome: true,
        });

        dailyGamesMap.set(game.visitor_team.id.toString(), {
          gameStatus: game.status,
          opponent: game.home_team.abbreviation,
          gameDate: gameDate,
          isHome: false,
        });
      }
    });

    return weekGamesMap;
  } catch (error) {
    console.log("Error fetching week games info:", error);
    return new Map();
  }
};

const fillLineupWithGameData = (
  lineup: any[],
  dateStr: string,
  dailyGamesMap: Map<string, any>,
): any[] => {
  return lineup.map((slot) => {
    if (!slot.player) {
      return {
        position: slot.position,
        player: null,
        gameInfo: null,
        gameStats: null,
      };
    }

    const teamId = slot.player.teamId;
    const gameInfo = dailyGamesMap.get(teamId.toString()) || null;

    return {
      position: slot.position,
      player: slot.player,
      gameInfo: gameInfo,
      gameStats: {
        pts: 0,
        ast: 0,
        reb: 0,
        stl: 0,
        blk: 0,
        tov: 0,
        fpts: 0,
        min: 0,
      },
    };
  });
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
