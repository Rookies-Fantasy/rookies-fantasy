import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { DEFAULT_SEASON, type SeasonConfigDoc } from "./data/season.js";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isIsoDate = (value: string): boolean =>
  ISO_DATE_PATTERN.test(value) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

const readSeasonArgs = (): SeasonConfigDoc => {
  const { values } = parseArgs({
    options: {
      season: { type: "string", default: DEFAULT_SEASON.season },
      start: { type: "string", default: DEFAULT_SEASON.startDate },
      end: { type: "string", default: DEFAULT_SEASON.endDate },
    },
  });
  const config: SeasonConfigDoc = {
    season: values.season,
    startDate: values.start,
    endDate: values.end,
  };

  if (!isIsoDate(config.startDate) || !isIsoDate(config.endDate)) {
    throw new Error("--start and --end must be YYYY-MM-DD dates.");
  }
  if (config.startDate >= config.endDate) {
    throw new Error("--start must be before --end.");
  }

  return config;
};

const main = async (): Promise<void> => {
  const config = readSeasonArgs();
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const serviceAccount = JSON.parse(
    await readFile(path.join(scriptDir, "serviceAccountKey.json"), "utf-8"),
  );
  initializeApp({ credential: cert(serviceAccount) });

  await getFirestore()
    .collection("config")
    .doc("season")
    .set({ ...config, updatedAt: FieldValue.serverTimestamp() });

  console.log(
    `Wrote config/season to ${serviceAccount.project_id}: ${config.season} (${config.startDate} to ${config.endDate})`,
  );
};

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
