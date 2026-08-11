import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { run as simulateDay } from "./simulateDay.js";
import type { Matchup } from "../../../client/types/matchup";

const parseDate = (value?: string): string => {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date().toISOString().split("T")[0];
};

const addDays = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
};

const getWeekStart = (dateString: string): string => {
  const date = new Date(`${dateString}T00:00:00Z`);
  const dayOfWeek = date.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().split("T")[0];
};

const getWeekEnd = (dateString: string): string => addDays(getWeekStart(dateString), 6);

const getDatesBetween = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  let current = startDate;

  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
};

const getPendingDates = (
  matchup: Matchup,
  requestedStartDate: string,
): string[] => {
  const weekStart = matchup.weekStart || getWeekStart(requestedStartDate);
  const weekEnd = getWeekEnd(weekStart);
  const simulationStart = requestedStartDate > weekStart ? requestedStartDate : weekStart;
  const existingHomeDates = new Set(Object.keys(matchup.homeLineupSnapshots ?? {}));
  const existingAwayDates = new Set(Object.keys(matchup.awayLineupSnapshots ?? {}));

  return getDatesBetween(simulationStart, weekEnd).filter(
    (date) => !existingHomeDates.has(date) && !existingAwayDates.has(date),
  );
};

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const startDate = parseDate(process.env.SIM_DATE);
  const days = Number(process.env.SIM_DAYS ?? "7");

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("SIM_DAYS must be a positive number.");
  }

  const matchupId = process.env.MATCHUP_ID;

  if (matchupId) {
    const doc = await db.collection("matchups").doc(matchupId).get();
    if (!doc.exists) {
      throw new Error(`Matchup "${matchupId}" not found.`);
    }

    const matchup = doc.data() as Matchup;
    if (matchup.status !== "active") {
      console.warn(
        `Matchup "${matchupId}" is already ${matchup.status}. Skipping week simulation.`,
      );
      return;
    }

    const pendingDates = getPendingDates(matchup, startDate).slice(0, days);

    if (pendingDates.length === 0) {
      console.log(
        `Matchup "${matchupId}" already has snapshots for the requested week range.`,
      );
      return;
    }

    for (const day of pendingDates) {
      process.env.SIM_DATE = day;
      process.env.MATCHUP_ID = matchupId;
      await simulateDay(db, auth);
    }

    console.log(
      `Simulated ${pendingDates.length} day(s) for matchup ${matchupId} starting from ${startDate}`,
    );
    return;
  }

  const weekStart = getWeekStart(startDate);
  const weekEnd = getWeekEnd(startDate);
  const targetDates = getDatesBetween(startDate > weekStart ? startDate : weekStart, weekEnd);
  const limitedDates = targetDates.slice(0, days);

  for (const day of limitedDates) {
    process.env.SIM_DATE = day;
    await simulateDay(db, auth);
  }

  console.log(`Simulated ${limitedDates.length} day(s) starting from ${startDate}`);
};
