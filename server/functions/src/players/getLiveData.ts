import * as functions from "firebase-functions/v1";
import { admin } from "../shared/admin";
import { api } from "../shared/balldontlie";
import type { GameInfo } from "../shared/types";
import type { LiveData } from "./types";

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
