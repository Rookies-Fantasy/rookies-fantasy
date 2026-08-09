import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { NBAPlayersMigration } from "./NBAPlayersMigration.js";
import { NBATeamsMigration } from "./NBATeamsMigration.js";
import { AugmentsMigration } from "./AugmentsMigration.js";
import { NBAPlayerAveragesMigration } from "./NBAPlayerAveragesMigration.js";
import type { MigrationResult } from "../types/collections.js";
import type { NBAPlayer } from "../types/players.js";

// ESM-compatible __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize Firebase Admin
 */
const initializeFirebase = async () => {
  const useEmulator = process.env.USE_EMULATOR === "true";

  if (useEmulator) {
    console.log("Using Firestore Emulator");
    process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

    initializeApp({
      projectId: `${process.env.FIREBASE_PROJECT_ID}`,
    });
  } else {
    console.log("Using Production Firestore");

    // Read and parse JSON
    const serviceAccountPath = path.join(
      __dirname,
      "..",
      "serviceAccountKey.json"
    );
    const serviceAccountJSON = await readFile(serviceAccountPath, "utf-8");
    const serviceAccount = JSON.parse(serviceAccountJSON);

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
};

const runAllMigrations = async () => {
  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY environment variable is required");
  }

  let db;
  try {
    db = await initializeFirebase();
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    process.exit(1);
  }

  try {
    // Prepare all migrations (fetch, transform, validate)
    interface PreparedMigration {
      name: string;
      migration: any;
      data: any;
    }

    const preparedData: PreparedMigration[] = [];

    // Prepare NBA Teams
    console.log("Preparing: NBA Teams");
    const teamsMigration = new NBATeamsMigration(db, apiKey);
    const teamsData = await teamsMigration.prepare();
    preparedData.push({
      name: "NBA Teams",
      migration: teamsMigration,
      data: teamsData,
    });

    // Prepare Augments
    console.log("Preparing: Augments");
    const augmentsMigration = new AugmentsMigration(db);
    const augmentsData = await augmentsMigration.prepare();
    preparedData.push({
      name: "Augments",
      migration: augmentsMigration,
      data: augmentsData,
    });

    // Prepare NBA Players
    console.log("Preparing: NBA Players");
    const playersMigration = new NBAPlayersMigration(db, apiKey);
    const playersData = await playersMigration.prepare();
    preparedData.push({
      name: "NBA Players",
      migration: playersMigration,
      data: playersData,
    });

    // Prepare NBA Player Averages (using players data)
    console.log("Preparing: NBA Player Averages");
    const averagesMigration = new NBAPlayerAveragesMigration(
      db,
      playersData as NBAPlayer[]
    );
    const averagesData = await averagesMigration.prepare();
    preparedData.push({
      name: "NBA Player Averages",
      migration: averagesMigration,
      data: averagesData,
    });

    console.log("\n All migrations prepared successfully!");

    // Execute all migrations (clear and insert)
    const results: MigrationResult[] = [];
    for (const { name, migration, data } of preparedData) {
      console.log(`Executing: ${name}`);
      const result = await migration.execute(data as any);
      results.push(result);
    }

    console.log("ALL MIGRATIONS COMPLETED!");

    console.log("Summary:");
    results.forEach((result) => {
      console.log(
        ` ${result.collectionName}: ${result.documentsCreated} documents`
      );
    });

    console.log("");
    process.exit(0);
  } catch (error) {
    console.error("MIGRATION FAILED!");

    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );

    console.log("\n No data was written to Firestore.");
    console.log("All collections remain in their original state.\n");

    process.exit(1);
  }
};

// Run migrations
runAllMigrations();
