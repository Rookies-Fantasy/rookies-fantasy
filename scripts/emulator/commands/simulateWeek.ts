import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { run as simulateDay } from "./simulateDay.js";
import type { Matchup } from "../../../client/types/matchup.js";
import { getActiveMatchups } from "../fixtures/matchups.js";
import { getSimulationDates, parseDate } from "../utils/dateUtils.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const requestedDate =
    process.env.SIM_DATE === undefined
      ? undefined
      : parseDate(process.env.SIM_DATE, "SIM_DATE");
  const days = Number(process.env.SIM_DAYS ?? "7");

  if (!Number.isInteger(days) || days <= 0) {
    throw new Error("SIM_DAYS must be a positive integer.");
  }

  const matchups = await getActiveMatchups(db, process.env.MATCHUP_ID);
  // Validate every matchup's range before writing any snapshots.
  const plans = matchups.map((doc) => {
    const matchup = doc.data() as Matchup;
    const pendingDates = getSimulationDates(
      doc.id,
      matchup.weekStart,
      requestedDate,
    )
      .filter(
        (date) =>
          !matchup.homeLineupSnapshots?.[date] &&
          !matchup.awayLineupSnapshots?.[date],
      )
      .slice(0, days);
    return { doc, pendingDates };
  });

  for (const { doc, pendingDates } of plans) {
    if (pendingDates.length === 0) {
      console.log(
        `Matchup "${doc.id}" already has snapshots for the requested week range.`,
      );
      continue;
    }

    for (const day of pendingDates) {
      await simulateDay(db, auth, { date: day, matchupId: doc.id });
    }

    console.log(
      `Simulated ${pendingDates.length} day(s) for matchup ${doc.id} starting from ${pendingDates[0]}`,
    );
  }
};
