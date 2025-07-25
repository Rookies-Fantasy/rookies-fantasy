import { BalldontlieAPI } from "@balldontlie/sdk";
import "dotenv/config";
import { db } from "./firebaseConfig.js";

const api = new BalldontlieAPI({ apiKey: process.env.BALLDONTLIE_API_KEY });

const parsePositions = (pos) => {
  if (!pos || typeof pos !== "string") return [];

  return pos
    .split("-") // Split on dash
    .map((p) => p.trim()) // Remove any whitespace
    .filter(Boolean); // Remove empty values (in case of malformed input)
};

const normalizePlayer = (player) => {
  return {
    playerId: player.id.toString(),
    teamId: player.team.id.toString(),
    firstName: player.first_name,
    lastName: player.last_name,
    positions: parsePositions(player.position),
    height: player.height,
    weight: player.weight,
    jerseyNumber: player.jersey_number,
    country: player.country,
    headshotURL: "",
  };
};

const populateNBAPlayers = async () => {
  let cursor = undefined;
  let totalStored = 0;

  try {
    const batch = db.batch();
    do {
      const response = await api.nba.getActivePlayers({
        cursor,
        per_page: 100,
      });

      const players = response.data;
      const meta = response.meta;

      if (!players || players.length === 0) {
        console.log("No more players found.");
        break;
      }

      const playersRef = db.collection("nbaPlayers");

      players.forEach((player) => {
        const normalized = normalizePlayer(player);
        const docRef = playersRef.doc();
        batch.set(docRef, normalized);
      });

      totalStored += players.length;

      console.log(
        `Stored ${players.length} players. Total so far: ${totalStored}`
      );
      cursor = meta?.next_cursor;
    } while (cursor);

    await batch.commit();
    console.log(`Finished storing NBA players. Total stored: ${totalStored}`);
  } catch (error) {
    console.error("Error fetching/storing NBA players:", error);
  }
};

populateNBAPlayers();
