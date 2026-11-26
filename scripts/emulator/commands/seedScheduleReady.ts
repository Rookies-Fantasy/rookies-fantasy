import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import {
  createScheduleReadyScenario,
  SCHEDULE_LEAGUES,
  SCHEDULE_MEMBER_COUNT,
} from "../scenarios/scheduleReady.js";

export const run = async (db: Firestore, auth: Auth): Promise<void> => {
  const memberEmails = Array.from(
    { length: SCHEDULE_MEMBER_COUNT },
    (_, index) => `sch${index + 1}@test.com`,
  );
  const password = process.env.USER_PASSWORD ?? "password123";
  await createScheduleReadyScenario(db, auth, { memberEmails, password });

  const { short, odd, even, open } = SCHEDULE_LEAGUES;
  console.log("Created schedule-ready scenario");
  console.log(`  Members: sch1..${SCHEDULE_MEMBER_COUNT}@test.com / ${password}`);
  console.log(`  ${short.id}: 3/4 teams, deadline passed -> cancelled (unscheduled); sch1 can extend or delete`);
  console.log(`  ${odd.id}: 5/6 teams, deadline passed -> scheduled with byes`);
  console.log(`  ${even.id}: 8/10 teams, deadline passed -> scheduled, 4-team playoffs`);
  console.log(`  ${open.id}: 4/4 teams, deadline today -> left forming`);
  console.log("  Run generateLeagueSchedules from the Functions shell to schedule them.");
};
