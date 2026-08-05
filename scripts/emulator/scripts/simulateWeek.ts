import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { run as simulateDay } from "./simulateDay.js";

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

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const startDate = parseDate(process.env.SIM_DATE);
  const days = Number(process.env.SIM_DAYS ?? "7");

  if (!Number.isFinite(days) || days <= 0) {
    throw new Error("SIM_DAYS must be a positive number.");
  }

  for (let i = 0; i < days; i += 1) {
    const day = addDays(startDate, i);
    process.env.SIM_DATE = day;
    await simulateDay(db, auth);
  }

  console.log(`Simulated ${days} day(s) starting from ${startDate}`);
};
