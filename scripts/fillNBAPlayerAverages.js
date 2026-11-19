import { BalldontlieAPI } from "@balldontlie/sdk";
import { db } from "./firebaseConfig.js";
import "dotenv/config";
import fetch from "node-fetch";

const api = new BalldontlieAPI({ apiKey: process.env.BALLDONTLIE_API_KEY });
const SEASON = 2024;

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const normalizeAverages = (raw) => ({
  playerId: raw.player.id.toString(),
  seasonId: raw.season.toString(),
  gamesPlayed: raw.stats.gp,
  averageStats: {
    minutes: raw.stats.min,
    fieldGoalsMade: raw.stats.fgm,
    fieldGoalsAttempted: raw.stats.fga,
    fieldGoalPercentage: raw.stats.fg_pct,
    freeThrowsAttempted: raw.stats.fta,
    freeThrowsMade: raw.stats.ftm,
    freeThrowPerfectange: raw.stats.ft_pct,
    threePointersAttempted: raw.stats.fg3a,
    threePointersMade: raw.stats.fg3m,
    threePointerPercentage: raw.stats.fg3_pct,
    rebounds: raw.stats.reb,
    assists: raw.stats.ast,
    steals: raw.stats.stl,
    blocks: raw.stats.blk,
    turnovers: raw.stats.tov,
    personalFouls: raw.stats.pf,
    points: raw.stats.pts,
  },
});

const fetchAllActivePlayerIds = async () => {
  const playerIds = [];
  let cursor = undefined;

  while (true) {
    const response = await api.nba.getActivePlayers({ cursor, per_page: 25 });
    const players = response.data;
    playerIds.push(...players.map((p) => p.id));
    if (!response.meta?.next_cursor) break;
    cursor = response.meta.next_cursor;
  }

  return playerIds;
};

const fetchAndStoreSeasonAverages = async () => {
  try {
    const allPlayerIds = await fetchAllActivePlayerIds();
    const playerChunks = chunkArray(allPlayerIds, 25);

    const allAverages = [];

    for (const chunk of playerChunks) {
      const queryParams = chunk.map((id) => `player_ids[]=${id}`).join("&");
      const url = `https://api.balldontlie.io/v1/season_averages/general?season=${SEASON}&season_type=regular&type=base&${queryParams}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.BALLDONTLIE_API_KEY}` },
      });

      const data = await res.json();
      allAverages.push(...data.data);
    }

    // Normalize and batch insert into Firestore
    const batch = db.batch();
    const averagesRef = db.collection("nbaPlayerAverages");

    allAverages.forEach((avg) => {
      const normalized = normalizeAverages(avg);
      const docRef = averagesRef.doc();
      batch.set(docRef, normalized);
    });

    await batch.commit();
    console.log(`Stored season averages for ${allAverages.length} players.`);
  } catch (err) {
    console.error("Error fetching/storing season averages:", err);
  }
};

fetchAndStoreSeasonAverages();
