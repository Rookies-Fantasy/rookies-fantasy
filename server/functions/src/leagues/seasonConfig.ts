import type { Firestore } from "firebase-admin/firestore";
import { SeasonConfig, toSeasonConfig } from "./season";
import { EMPTY_PAYLOAD } from "./types";

const CONFIG_COLLECTION = "config";
const SEASON_CONFIG_DOC = "season";

// Reads `config/season`. Returns null when the doc is missing or malformed so
// each caller decides how to fail: callables throw, the daily scheduler skips.
export const readSeasonConfig = async (
  db: Firestore,
): Promise<SeasonConfig | null> => {
  const snapshot = await db
    .collection(CONFIG_COLLECTION)
    .doc(SEASON_CONFIG_DOC)
    .get();
  const season = snapshot.exists
    ? toSeasonConfig(snapshot.data() ?? EMPTY_PAYLOAD)
    : null;

  if (season === null) {
    console.error("config/season is missing or has malformed fields");
  }

  return season;
};
