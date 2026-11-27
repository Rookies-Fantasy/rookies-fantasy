import type { UserRecord } from "firebase-admin/auth";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cleanUpDeletedUser } from "./users/deleteUserData";
import * as functions from "firebase-functions/v1";
import { BalldontlieAPI } from "@balldontlie/sdk";
import {
  EMPTY_PAYLOAD,
  JsonValue,
  LeagueDocument,
  LeagueStandingTeam,
  RawPayload,
} from "./leagues/types";
import {
  evaluateJoinEligibility,
  evaluateUpdateEligibility,
  getOwnerTeamId,
  isLeagueMember,
  JoinRejectionCode,
  recomputeBalance,
  toLeagueDocument,
  toLeagueTeamRefs,
  toRosterCost,
  toStandingTeam,
  UpdateRejectionCode,
  validateCreateLeagueInput,
  validateJoinLeagueInput,
  validateLeagueId,
  validateUpdateLeagueInput,
} from "./leagues/validation";
import { completeMatchup } from "./matchups/completeMatchup";
import { pairQueuedUsers } from "./matchups/processQueue";
import { writeDailyMatchupSnapshots } from "./matchups/dailySnapshots";
import { getDailyScoringTarget, isMatchupWeekOver } from "./utils/dates";

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

type LineupSnapshotItem = {
  position: TeamPosition;
  playerSnapshot: PlayerSnapshot;
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

const ALREADY_EXISTS_CODE = 6; // gRPC status code for ALREADY_EXISTS

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
      await usersRef.doc(uid).create({
        id: uid,
        email: email,
        emailVerified: emailVerified,
        queueStatus: "idle",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === ALREADY_EXISTS_CODE
      ) {
        console.log(`User doc for ${uid} already exists, skipping create`);
        return;
      }
      console.error("Error creating user in Firestore:", error);
    }
  });

// Cleans up a user's data after their auth account is deleted (in-app
// account deletion, required by App Store guideline 5.1.1(v)).
export const deleteUserData = functions.auth
  .user()
  .onDelete(async (user: UserRecord) => {
    const { uid } = user;

    try {
      const result = await cleanUpDeletedUser(admin.firestore(), uid);
      console.log(
        `Cleaned up deleted user ${uid}: anonymized=${result.anonymized}, ` +
          `leaguesRemovedFrom=${result.leaguesRemovedFrom}, ` +
          `leaguesDeleted=${result.leaguesDeleted}`,
      );
    } catch (error) {
      console.error(`Error cleaning up deleted user ${uid}:`, error);
      throw error;
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
    // The job runs after midnight PT and scores yesterday's (PT) games. They
    // belong to yesterday's date and to the matchup week containing it, so
    // Sunday's games count toward the week that is ending.
    const scoringTarget = getDailyScoringTarget(now);

    const gamelogUrl = `https://api.balldontlie.io/v1/stats?dates[]=${scoringTarget.gameDate}`;

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

    // === UPDATE MATCHUPS COLLECTION ===
    // Save the current state of the lineups and players to the history. These are immutable snapshots
    try {
      const updatedMatchupIds = await writeDailyMatchupSnapshots(
        admin.firestore(),
        scoringTarget,
        (lineup, augment) =>
          getLineupSnapshot(
            lineup as TeamLineupSlot[] | null,
            gamelogMap,
            augment,
          ),
      );
      console.log(
        `Wrote ${scoringTarget.gameDate} snapshots to ${updatedMatchupIds.length} matchups in week ${scoringTarget.weekStart}`,
      );
    } catch (err) {
      console.error("Matchup snapshot update FAILED:", err);
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

const getLineupSnapshot = (
  lineup: TeamLineupSlot[] | null,
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

    if (before.queueStatus === "queued" || after.queueStatus !== "queued") {
      return;
    }

    try {
      const result = await pairQueuedUsers(
        admin.firestore(),
        getNextMondayDate,
      );
      if (result.status === "matched") {
        console.log(
          `Match created: ${result.matchupId} between ${result.userIds.join(" and ")}`,
        );
      } else if (result.removedUserIds.length > 0) {
        console.warn(
          `Removed invalid queue entries: ${result.removedUserIds.join(", ")}`,
        );
      }

      // TODO: Implement push notifications
    } catch (error) {
      console.error("Error processing queue:", error);
    }
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
        .where("leagueId", "==", null)
        .where("status", "==", "active")
        .get();

      // Only complete matchups whose week has ended. Matchups created during
      // the past week for the week starting today stay active.
      const now = new Date();
      const endedMatchups = activeMatchupsSnapshot.docs.filter((matchupDoc) =>
        isMatchupWeekOver(matchupDoc.data().weekStart, now),
      );

      console.log(
        `Found ${activeMatchupsSnapshot.size} active matchups, ${endedMatchups.length} from previous weeks`,
      );

      const matchupUpdates = endedMatchups.map(async (matchupDoc) => {
        const completed = await completeMatchup(db, matchupDoc);
        if (completed) {
          console.log(`Matchup ${matchupDoc.id} completed`);
        }
      });

      await Promise.all(matchupUpdates);

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

const LEAGUE_COLLECTION = "leagues";
const USER_COLLECTION = "users";
const TEAM_SUBCOLLECTION = "teams";

// Reads a league document into its typed shape. Returns null when the document
// does not exist, which the eligibility rules treat as "League not found".
// Returns null when the league does not exist. A league that exists but does
// not parse is corrupt — only the server writes these documents — so it throws
// rather than letting the caller act on a half-read league.
const readLeagueDocument = (
  snapshot: FirebaseFirestore.DocumentSnapshot,
): LeagueDocument | null => {
  if (!snapshot.exists) {
    return null;
  }

  const league = toLeagueDocument(snapshot.data() ?? EMPTY_PAYLOAD);

  if (league === null) {
    console.error(`League ${snapshot.id} is missing or has malformed fields`);
    throw new functions.https.HttpsError("internal", "League data is invalid");
  }

  return league;
};

// The league fields returned to the client. Mirrors `League` in
// client/types/league.ts.
type LeagueResponse = {
  id: string;
  name: string;
  creatorUserId: string;
  numberOfTeams: number;
  budget: number;
  memberCount: number;
  teamIds: string[];
  userIds: string[];
};

const toLeagueResponse = (
  id: string,
  league: LeagueDocument,
): LeagueResponse => ({
  id,
  name: league.name,
  creatorUserId: league.creatorUserId,
  numberOfTeams: league.numberOfTeams,
  budget: league.budget,
  memberCount: league.memberCount,
  teamIds: league.teamIds,
  userIds: league.userIds,
});

// Creates a league on behalf of the caller.
export const createLeague = functions.https.onCall(
  async (data: RawPayload, context): Promise<{ league: LeagueResponse }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to create a league",
      );
    }

    const uid = context.auth.uid;
    const validation = validateCreateLeagueInput(data ?? EMPTY_PAYLOAD);

    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.message,
      );
    }

    const input = validation.input;
    const db = admin.firestore();

    // The initial team must belong to the caller, otherwise a league could be
    // seeded with somebody else's team id.
    const teamDoc = await db
      .collection(USER_COLLECTION)
      .doc(uid)
      .collection(TEAM_SUBCOLLECTION)
      .doc(input.initialTeamId)
      .get();

    if (!teamDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Team not found for the signed-in user",
      );
    }

    const leagueRef = db.collection(LEAGUE_COLLECTION).doc();
    const league: LeagueDocument = {
      name: input.name,
      creatorUserId: uid,
      numberOfTeams: input.numberOfTeams,
      budget: input.budget,
      memberCount: 1,
      teamIds: [input.initialTeamId],
      userIds: [uid],
      teamOwners: { [input.initialTeamId]: uid },
    };

    try {
      await leagueRef.set({
        ...league,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating league:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create league",
      );
    }

    return { league: toLeagueResponse(leagueRef.id, league) };
  },
);

const JOIN_REJECTION_STATUS: Record<
  JoinRejectionCode,
  functions.https.FunctionsErrorCode
> = {
  "team-already-joined": "already-exists",
  "user-already-joined": "already-exists",
  "league-full": "resource-exhausted",
};

// The team fields returned to the client. The client fills the empty lineup
// and bench from its own defaults, exactly as it would for a fresh team read.
type JoinedTeamResponse = {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  balance: number;
  isLeagueTeam: boolean;
};

// Finds which of the league's teams belongs to the caller. Team ids are only
// unique within a user's own subcollection, so each league team id is looked
// up under the caller's path; at most MAX_TEAMS reads in one round trip.
// Returns null when none match, e.g. a membership written by an older client
// whose team was later deleted.
const findCallerLeagueTeam = async (
  transaction: FirebaseFirestore.Transaction,
  db: FirebaseFirestore.Firestore,
  uid: string,
  leagueTeamIds: string[],
): Promise<JoinedTeamResponse | null> => {
  if (leagueTeamIds.length === 0) {
    return null;
  }

  const teamsRef = db
    .collection(USER_COLLECTION)
    .doc(uid)
    .collection(TEAM_SUBCOLLECTION);
  const snapshots = await transaction.getAll(
    ...leagueTeamIds.map((teamId) => teamsRef.doc(teamId)),
  );
  const match = snapshots.find((snapshot) => snapshot.exists) ?? null;

  return match === null ? null : toJoinedTeamResponse(match);
};

const readString = (value: JsonValue, fallback: string): string =>
  typeof value === "string" ? value : fallback;

// Team documents can also be written by the client, so every field falls back
// to a typed default instead of trusting the stored shape.
const toJoinedTeamResponse = (
  snapshot: FirebaseFirestore.DocumentSnapshot,
): JoinedTeamResponse => {
  const data: RawPayload = snapshot.data() ?? EMPTY_PAYLOAD;
  const { balance, isLeagueTeam } = data;

  return {
    id: snapshot.id,
    name: readString(data.name, ""),
    abbreviation: readString(data.abbreviation, ""),
    logoUrl: readString(data.logoUrl, ""),
    balance:
      typeof balance === "number" && Number.isFinite(balance) ? balance : 0,
    isLeagueTeam: typeof isLeagueTeam === "boolean" ? isLeagueTeam : true,
  };
};

// Creates the caller's league team and adds it to the league as one
// transaction. Either both writes land or neither does, so a rejected join
// (league full, already a member, ...) never leaves an orphaned team document,
// and a team can never exist half-joined.
export const joinLeague = functions.https.onCall(
  async (
    data: RawPayload,
    context,
  ): Promise<{ league: LeagueResponse; team: JoinedTeamResponse }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to join a league",
      );
    }

    const uid = context.auth.uid;
    const validation = validateJoinLeagueInput(data ?? EMPTY_PAYLOAD);

    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.message,
      );
    }

    const { leagueId, team } = validation.input;
    const db = admin.firestore();
    const leagueRef = db.collection(LEAGUE_COLLECTION).doc(leagueId);
    // Allocating the id is local — nothing is written until the transaction
    // commits.
    const teamRef = db
      .collection(USER_COLLECTION)
      .doc(uid)
      .collection(TEAM_SUBCOLLECTION)
      .doc();

    try {
      return await db.runTransaction(async (transaction) => {
        const league = readLeagueDocument(await transaction.get(leagueRef));

        if (league === null) {
          throw new functions.https.HttpsError("not-found", "League not found");
        }

        // A repeat join from a member is answered with their existing team
        // rather than an error. This is what makes a retry safe when the
        // response to a committed join was lost: the client gets the same
        // result it missed, and nothing new is written.
        if (league.userIds.includes(uid)) {
          const existingTeam = await findCallerLeagueTeam(
            transaction,
            db,
            uid,
            league.teamIds,
          );

          if (existingTeam !== null) {
            return {
              league: toLeagueResponse(leagueId, league),
              team: existingTeam,
            };
          }
        }

        const eligibility = evaluateJoinEligibility(league, teamRef.id, uid);

        if (!eligibility.allowed) {
          throw new functions.https.HttpsError(
            JOIN_REJECTION_STATUS[eligibility.code],
            eligibility.message,
          );
        }

        // Same shape UserController.addUserTeam writes, except the balance is
        // the league budget decided here rather than a value the client sends.
        transaction.create(teamRef, {
          name: team.name,
          abbreviation: team.abbreviation,
          logoUrl: team.logoUrl,
          balance: league.budget,
          isLeagueTeam: true,
          record: { wins: 0, losses: 0, draws: 0 },
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.update(leagueRef, {
          memberCount: FieldValue.increment(1),
          teamIds: FieldValue.arrayUnion(teamRef.id),
          userIds: FieldValue.arrayUnion(uid),
          // Auto-generated doc ids never contain ".", so this field path is
          // always a single key in the map.
          [`teamOwners.${teamRef.id}`]: uid,
          updatedAt: FieldValue.serverTimestamp(),
        });

        return {
          league: toLeagueResponse(leagueId, {
            ...league,
            memberCount: league.memberCount + 1,
            teamIds: [...league.teamIds, teamRef.id],
            userIds: [...league.userIds, uid],
            teamOwners: { ...league.teamOwners, [teamRef.id]: uid },
          }),
          team: {
            id: teamRef.id,
            name: team.name,
            abbreviation: team.abbreviation,
            logoUrl: team.logoUrl,
            balance: league.budget,
            isLeagueTeam: true,
          },
        };
      });
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Error joining league:", error);
      throw new functions.https.HttpsError("internal", "Failed to join league");
    }
  },
);

const UPDATE_REJECTION_STATUS: Record<
  UpdateRejectionCode,
  functions.https.FunctionsErrorCode
> = {
  "not-league-owner": "permission-denied",
  "below-member-count": "failed-precondition",
  "budget-locked": "failed-precondition",
  "roster-over-budget": "failed-precondition",
};

type OwnerTeamBalance = {
  ref: FirebaseFirestore.DocumentReference;
  balance: number;
};

// Reads the owner's league team inside the update transaction and works out
// its balance under the new budget. Throws when the roster costs more than the
// budget, so neither the league nor the team is written.
const readOwnerTeamBalance = async (
  transaction: FirebaseFirestore.Transaction,
  league: LeagueDocument,
  budget: number,
): Promise<OwnerTeamBalance | null> => {
  const teamId = getOwnerTeamId(league);
  if (teamId === null) {
    return null;
  }

  const teamRef = admin
    .firestore()
    .collection(USER_COLLECTION)
    .doc(league.creatorUserId)
    .collection(TEAM_SUBCOLLECTION)
    .doc(teamId);
  const teamSnapshot = await transaction.get(teamRef);

  if (!teamSnapshot.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Your league team was not found",
    );
  }

  const rosterCost = toRosterCost(teamSnapshot.data() ?? EMPTY_PAYLOAD);
  if (rosterCost === null) {
    console.error(`Team ${teamId} has a malformed lineup or bench`);
    throw new functions.https.HttpsError("internal", "Team data is invalid");
  }

  const recompute = recomputeBalance(budget, rosterCost);
  if (!recompute.allowed) {
    throw new functions.https.HttpsError(
      UPDATE_REJECTION_STATUS[recompute.code],
      recompute.message,
    );
  }

  return { ref: teamRef, balance: recompute.balance };
};

// Updates a league's settings on behalf of its owner.
export const updateLeague = functions.https.onCall(
  async (data: RawPayload, context): Promise<{ league: LeagueResponse }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be signed in to edit a league",
      );
    }

    const uid = context.auth.uid;
    const validation = validateUpdateLeagueInput(data ?? EMPTY_PAYLOAD);

    if (!validation.valid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        validation.message,
      );
    }

    const input = validation.input;
    const db = admin.firestore();
    const leagueRef = db.collection(LEAGUE_COLLECTION).doc(input.leagueId);

    try {
      return await db.runTransaction(async (transaction) => {
        // Read inside the transaction so a join landing mid-edit can't slip
        // past the member-count and budget checks.
        const league = readLeagueDocument(await transaction.get(leagueRef));

        if (league === null) {
          throw new functions.https.HttpsError("not-found", "League not found");
        }

        const eligibility = evaluateUpdateEligibility(league, input, uid);

        if (!eligibility.allowed) {
          throw new functions.https.HttpsError(
            UPDATE_REJECTION_STATUS[eligibility.code],
            eligibility.message,
          );
        }

        // Each team's balance starts at the budget, so a budget change has to
        // carry over to the owner's team (the only one in the league, since
        // the budget locks once anyone else joins). Read before any write.
        const ownerTeam =
          input.budget === league.budget
            ? null
            : await readOwnerTeamBalance(transaction, league, input.budget);

        transaction.update(leagueRef, {
          name: input.name,
          numberOfTeams: input.numberOfTeams,
          budget: input.budget,
          updatedAt: FieldValue.serverTimestamp(),
        });

        if (ownerTeam !== null) {
          transaction.update(ownerTeam.ref, {
            balance: ownerTeam.balance,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        return {
          league: toLeagueResponse(input.leagueId, {
            ...league,
            name: input.name,
            numberOfTeams: input.numberOfTeams,
            budget: input.budget,
          }),
        };
      });
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      console.error("Error updating league:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update league",
      );
    }
  },
);

// Returns the standings-relevant data for every team in a league.
export const getLeagueStandings = functions.https.onRequest(
  async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).send("Unauthorized");
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    let uid: string;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      res.status(401).send("Unauthorized");
      return;
    }

    const rawLeagueId = req.query.leagueId;
    const validation = validateLeagueId(
      typeof rawLeagueId === "string" ? rawLeagueId : "",
    );

    if (!validation.valid) {
      res.status(400).send(validation.message);
      return;
    }

    try {
      const db = admin.firestore();
      const leagueSnapshot = await db
        .collection(LEAGUE_COLLECTION)
        .doc(validation.input)
        .get();

      const league = readLeagueDocument(leagueSnapshot);

      if (league === null) {
        res.status(404).send("League not found");
        return;
      }

      // Only members of the league may view its standings.
      if (!isLeagueMember(league, uid)) {
        res.status(403).send("Forbidden");
        return;
      }

      // Each team is read from the member who registered it, so a team doc
      // another user created under a league team's id is never included.
      const teamRefs = toLeagueTeamRefs(league).map(({ teamId, ownerId }) =>
        db
          .collection(USER_COLLECTION)
          .doc(ownerId)
          .collection(TEAM_SUBCOLLECTION)
          .doc(teamId),
      );

      const snapshots =
        teamRefs.length === 0 ? [] : await db.getAll(...teamRefs);

      const teams: LeagueStandingTeam[] = snapshots.flatMap((snapshot) =>
        snapshot.exists
          ? [toStandingTeam(snapshot.id, snapshot.data() ?? EMPTY_PAYLOAD)]
          : [],
      );

      res.json({ teams });
    } catch (err) {
      console.error("Error fetching league standings:", err);
      res.status(500).json({ error: "Failed to fetch standings" });
    }
  },
);
