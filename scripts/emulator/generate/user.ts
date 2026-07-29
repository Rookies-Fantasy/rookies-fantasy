import type { UserDoc } from "../types/firestore.js";

export const createUserDoc = (
  email: string,
  overrides: Partial<UserDoc> = {},
): UserDoc => ({
  id: overrides.id ?? "",
  email,
  emailVerified: overrides.emailVerified ?? true,
  queueStatus: overrides.queueStatus ?? "idle",
  teamId: overrides.teamId,
  currentMatchupId: overrides.currentMatchupId,
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
});
