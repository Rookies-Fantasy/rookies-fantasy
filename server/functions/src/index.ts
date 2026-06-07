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
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fantasyPoints: number;
  minutes: number;
};

type LiveData = Record<
  number,
  {
    gameInfo: GameInfo;
    gameStats: GameStats;
  }
>;

type TeamRecord = {
  wins: number;
  losses: number;
  draws: number;
};

type Position = "PG" | "SG" | "SF" | "PF" | "C";
type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";
type TeamPosition = Position | FlexPosition;

type PlayerTeamDisplay = {
  firstName: string;
  lastName: string;
  headshotUrl: string;
  positions: TeamPosition[];
  salary: number;
  id: string;
  teamAbbreviation: string;
};

type TeamLineupSlot = {
  position: TeamPosition;
  player: PlayerTeamDisplay | null;
};

// Store the augment id for now, maybe reconsider this later. Some things to consider are what we actually need to display the team (probably just name and icon)
// as well as augment versioning for future patches
type Team = {
  abbreviation?: string;
  augmentId?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
  lineup: TeamLineupSlot[];
  record?: TeamRecord;
};

type PlayerSnapshot = {
  firstName: string;
  lastName: string;
  headshotUrl: string;
  positions: TeamPosition[];
  salary: number;
  id: string;
  gameStats: GameStats;
  gameInfo: GameInfo;
};

type TeamSnapshot = {
  name: string;
  logoUrl: string;
  record: TeamRecord;
  augmentSnapshot?: any;
  score?: number;
};

type LineupSnapshotItem = {
  position: TeamPosition;
  playerSnapshot: PlayerSnapshot;
};

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

const apiKey = process.env.BALLDONTLIE_API_KEY || "";
const api = new BalldontlieAPI({ apiKey });
const cachedData: LiveData = {};
let lastFetchTime = 0;
const CACHE_EXPIRY_MS = 60 * 1000;

const getPlayersFromCache = (
  playerIds: number[],
): Record<number, LiveData[number] | null> => {
  const result: Record<number, LiveData[number] | null> = {};

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
            points: player.pts ?? 0,
            assists: player.ast ?? 0,
            rebounds: player.reb ?? 0,
            steals: player.stl ?? 0,
            blocks: player.blk ?? 0,
            turnovers: player.turnover ?? 0,
            fantasyPoints: player.fpts ?? 0,
            minutes: parseInt(player.min, 10) || 0,
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
            points: player.pts ?? 0,
            assists: player.ast ?? 0,
            rebounds: player.reb ?? 0,
            steals: player.stl ?? 0,
            blocks: player.blk ?? 0,
            turnovers: player.turnover ?? 0,
            fantasyPoints: player.fpts ?? 0,
            minutes: parseInt(player.min, 10) || 0,
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
  .pubsub.schedule("0 1 * * *") // runs every day at 1:00 AM PDT
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

    const seasonData = await fetchAllPagesFromUrl(seasonUrl, apiKey);

    const seasonAverages = seasonData.map((entry: any) => {
      const s = entry.stats;
      const p = entry.player;

      return {
        assists: s.ast,
        blocks: s.blk,
        fantasyPoints: calculateFantasyPoints(s),
        fieldGoalPercentage: s.fg_pct,
        fieldGoalsAttempted: s.fga,
        fieldGoalsMade: s.fgm,
        freeThrowPercentage: s.ft_pct,
        freeThrowsAttempted: s.fta,
        freeThrowsMade: s.ftm,
        minutes: s.min,
        playerId: String(p.id),
        points: s.pts,
        rebounds: s.reb,
        steals: s.stl,
        threePointerPercentage: s.fg3_pct,
        threePointersAttempted: s.fg3a,
        threePointersMade: s.fg3m,
        turnovers: s.tov ?? 0,
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

    const gamelogData = await fetchAllPagesFromUrl(gamelogUrl, apiKey);

    const playerGamelogs = gamelogData.map((gamelog: any) => {
      const gamelogForFPTS = { ...gamelog, tov: gamelog.turnover ?? 0 };

      return {
        assists: gamelog.ast,
        blocks: gamelog.blk,
        date: gamelog.game.date,
        fantasyPoints: calculateFantasyPoints(gamelogForFPTS),
        fieldGoalPercentage: gamelog.fg_pct,
        fieldGoalsAttempted: gamelog.fga,
        fieldGoalsMade: gamelog.fgm,
        freeThrowPerfectange: gamelog.ft_pct,
        freeThrowsAttempted: gamelog.fta,
        freeThrowsMade: gamelog.ftm,
        gameId: gamelog.game.id,
        homeTeamId: gamelog.game.home_team_id,
        minutes: gamelog.min,
        personalFouls: gamelog.pf,
        playerId: String(gamelog.player.id),
        points: gamelog.pts,
        rebounds: gamelog.reb,
        steals: gamelog.stl,
        teamId: gamelog.team.id,
        threePointerPercentage: gamelog.fg3_pct,
        threePointersAttempted: gamelog.fg3a,
        threePointersMade: gamelog.fg3m,
        turnovers: gamelog.turnover ?? 0,
        visitorTeamId: gamelog.game.visitor_team_id,
        player: gamelog.player,
        team: gamelog.team,
        game: gamelog.game,
      };
    });

    // Initialize batching
    let batch = admin.firestore().batch();
    let opCount = 0;
    const BATCH_LIMIT = 400;

    const seasonAvgMap: Record<string, any> = {};
    for (const avg of seasonAverages) {
      const { playerId, ...statsWithoutId } = avg;
      seasonAvgMap[playerId] = statsWithoutId;
    }

    const gamelogMap: Record<string, any> = {};
    for (const gamelog of playerGamelogs) {
      const { playerId, ...gamelogWithoutId } = gamelog;
      gamelogMap[playerId] = gamelogWithoutId;
    }

    console.log("Season map size:", Object.keys(seasonAvgMap).length);
    console.log("Gamelog map size:", Object.keys(gamelogMap).length);

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

      console.log("Writing nbaPlayer update:", {
        docId: playerDocRef.id,
        playerId: gamelog.playerId,
      });

      batch.update(playerDocRef, updateObj);

      opCount++;
      const result = await commitIfNeeded(batch, opCount, BATCH_LIMIT);
      batch = result.batch;
      opCount = result.count;
    }

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
          .doc(
            `users/${matchupData.homeUserId}/teams/${matchupData.homeTeamId}`,
          )
          .get(),
        admin
          .firestore()
          .doc(
            `users/${matchupData.awayUserId}/teams/${matchupData.awayTeamId}`,
          )
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

      const result = await commitIfNeeded(batch, opCount, BATCH_LIMIT);
      batch = result.batch;
      opCount = result.count;
    }

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

const fetchAllPagesFromUrl = async (url: string, apiKey?: string) => {
  let cursor: number | null = null;
  let results: any[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const finalUrl = cursor ? `${url}&cursor=${cursor}` : url;

    console.log("Fetching:", finalUrl);

    const response = await fetch(finalUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch:",
        response.status,
        response.statusText,
        "URL:",
        finalUrl,
      );
      break;
    }

    const json: any = await response.json();

    if (!json.data || !Array.isArray(json.data)) {
      console.error("Unexpected response format:", json);
      break;
    }

    results = results.concat(json.data);

    if (!json.meta?.next_cursor) break;

    cursor = json.meta.next_cursor;
  }

  return results;
};

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getLineupSnapshot = (
  lineup: TeamLineupSlot[],
  gamelogMap: Record<string, any>,
  augment?: any,
): LineupSnapshotItem[] => {
  if (!lineup || !Array.isArray(lineup)) return [];

  const { isValid, qualifyingPlayers } = validateAugment(augment, lineup);

  console.log(
    `Augment validation for team: isValid=${isValid}, qualifyingCount=${qualifyingPlayers.length}`,
  );

  return lineup.flatMap((slot) => {
    if (!slot.player) return [];

    const playerId = slot.player.id;
    const latestGamelog = gamelogMap[playerId];
    const emptyGameStats: GameStats = {
      points: 0,
      assists: 0,
      rebounds: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fantasyPoints: 0,
      minutes: 0,
    };
    const emptyGameInfo: GameInfo = {
      gameStatus: false,
      opponent: "",
      gameDate: "",
      isHome: false,
    };
    const gameStats = latestGamelog ?? emptyGameStats;

    // TODO: Do we need to store the fantasy points? Or can we calculate it at runtime?
    // Calculate fantasy points with augment effects
    let fantasyPoints = gameStats.fantasyPoints;
    if (latestGamelog && isValid) {
      const baseFantasyPoints = latestGamelog.fantasyPoints;
      fantasyPoints = applyAugmentEffects(
        baseFantasyPoints,
        latestGamelog,
        playerId,
        qualifyingPlayers,
        augment,
      );

      console.log(
        `Player ${playerId}: base=${baseFantasyPoints}, augmented=${fantasyPoints}`,
      );
    }

    return {
      position: slot.position,
      playerSnapshot: {
        firstName: slot.player.firstName,
        lastName: slot.player.lastName,
        headshotUrl: slot.player.headshotUrl,
        positions: slot.player.positions,
        salary: slot.player.salary,
        id: playerId,
        gameInfo: latestGamelog?.gameInfo ?? emptyGameInfo,
        gameStats: {
          points: gameStats.points ?? 0,
          assists: gameStats.assists ?? 0,
          rebounds: gameStats.rebounds ?? 0,
          steals: gameStats.steals ?? 0,
          blocks: gameStats.blocks ?? 0,
          turnovers: gameStats.turnovers ?? 0,
          fantasyPoints: fantasyPoints ?? 0,
          minutes: gameStats.minutes ?? 0,
        },
      },
    };
  });
};

const commitIfNeeded = async (
  batch: FirebaseFirestore.WriteBatch,
  count: number,
  limit: number,
) => {
  if (count >= limit) {
    await batch.commit();
    console.log("Committed batch");
    return {
      batch: admin.firestore().batch(),
      count: 0,
    };
  }

  return { batch, count: count + 1 };
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

// Augment validation and effects functions
const validateAugment = (augment: any, lineup: any[]) => {
  if (!augment || !augment.prerequisites) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const activePlayers = lineup
    .filter((slot) => slot.player !== null)
    .map((slot) => slot.player);

  let qualifyingPlayers: any[] = [];
  let allPrerequisitesMet = true;

  for (const prerequisite of augment.prerequisites) {
    const result = evaluatePrerequisite(prerequisite, activePlayers);

    if (!result.isValid) {
      allPrerequisitesMet = false;
      break;
    }

    if (qualifyingPlayers.length === 0) {
      qualifyingPlayers = result.qualifyingPlayers;
    } else {
      // Intersection: only keep players who qualify for all prerequisites
      qualifyingPlayers = qualifyingPlayers.filter((player: any) =>
        result.qualifyingPlayers.some((qp: any) => qp.id === player.id),
      );
    }
  }

  const hasEnoughPlayers =
    qualifyingPlayers.length >= (augment.playerCount || 0);

  return {
    isValid: allPrerequisitesMet && hasEnoughPlayers,
    qualifyingPlayers,
  };
};

const evaluatePrerequisite = (prerequisite: any, players: any[]) => {
  const { condition, type } = prerequisite;

  switch (type) {
    case "statThreshold":
      return evaluateStatThreshold(condition, players);
    case "positionRequirement":
      return evaluatePositionRequirement(condition, players);
    case "budgetThreshold":
      return evaluateBudgetThreshold(condition, players);
    default:
      return { isValid: false, qualifyingPlayers: [] };
  }
};

const evaluateStatThreshold = (condition: any, players: any[]) => {
  const { stat, operator, value, count } = condition;

  if (!stat || !operator || value === undefined) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const qualifyingPlayers = players.filter((player: any) => {
    const playerStatValue = getPlayerStatValue(player, stat);
    if (playerStatValue === null) return false;
    return evaluateCondition(playerStatValue, operator, value);
  });

  return {
    isValid: qualifyingPlayers.length >= count,
    qualifyingPlayers,
  };
};

const evaluatePositionRequirement = (condition: any, players: any[]) => {
  const { position, count } = condition;

  if (!position || position.length === 0) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const qualifyingPlayers = players.filter((player: any) =>
    player.positions?.some((pos: string) => position.includes(pos)),
  );

  return {
    isValid: qualifyingPlayers.length >= count,
    qualifyingPlayers,
  };
};

const evaluateBudgetThreshold = (condition: any, players: any[]) => {
  const { operator, value } = condition;

  if (!operator || value === undefined) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const totalSalary = players.reduce(
    (sum: number, player: any) => sum + (player.salary || 0),
    0,
  );
  const isValid = evaluateCondition(totalSalary, operator, value);

  return {
    isValid,
    qualifyingPlayers: isValid ? players : [],
  };
};

const getPlayerStatValue = (player: any, stat: string): number | null => {
  const { averageStats } = player;
  if (!averageStats) return null;

  switch (stat) {
    case "points":
      return averageStats.points;
    case "rebounds":
      return averageStats.rebounds;
    case "assists":
      return averageStats.assists;
    case "steals":
      return averageStats.steals;
    case "blocks":
      return averageStats.blocks;
    case "turnovers":
      return averageStats.turnovers;
    case "minutes":
      return averageStats.minutes;
    default:
      return null;
  }
};

const evaluateCondition = (
  playerValue: number,
  operator: string,
  threshold: number,
): boolean => {
  switch (operator) {
    case ">=":
      return playerValue >= threshold;
    case ">":
      return playerValue > threshold;
    case "<=":
      return playerValue <= threshold;
    case "<":
      return playerValue < threshold;
    case "=":
      return playerValue === threshold;
    default:
      return false;
  }
};

const applyAugmentEffects = (
  baseFantasyPoints: number,
  gameStats: any,
  playerId: string,
  qualifyingPlayers: any[],
  augment: any,
): number => {
  if (!augment || !augment.isActive || !qualifyingPlayers || !augment.effects) {
    return baseFantasyPoints;
  }

  const playerQualifies = qualifyingPlayers.some((p: any) => p.id === playerId);
  if (!playerQualifies) {
    return baseFantasyPoints;
  }

  if (!augment.effects || augment.effects.length === 0) {
    return baseFantasyPoints;
  }

  let totalPoints = baseFantasyPoints;

  augment.effects.forEach((effect: any) => {
    effect.statBoosts.forEach((boost: any) => {
      const statValue = getGameStatValue(gameStats, boost.stat);
      const baseStatMultiplier = getBaseStatMultiplier(boost.stat);

      const additionalBoost =
        statValue * baseStatMultiplier * (boost.multiplier - 1);
      totalPoints += additionalBoost;
    });
  });

  return totalPoints;
};

const getGameStatValue = (stats: any, stat: string): number => {
  switch (stat) {
    case "points":
      return stats.points || 0;
    case "rebounds":
      return stats.rebounds || 0;
    case "assists":
      return stats.assists || 0;
    case "steals":
      return stats.steals || 0;
    case "blocks":
      return stats.blocks || 0;
    case "turnovers":
      return stats.turnovers || 0;
    default:
      return 0;
  }
};

const getBaseStatMultiplier = (stat: string): number => {
  switch (stat) {
    case "points":
      return 1;
    case "rebounds":
      return 1;
    case "assists":
      return 2;
    case "steals":
      return 3;
    case "blocks":
      return 3;
    case "turnovers":
      return -2;
    default:
      return 0;
  }
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

const getThisMondayString = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Difference to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const date = String(monday.getDate()).padStart(2, "0");

  return `${year}-${month}-${date}`;
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
        res.status(404).send("No games found");
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
