import type { UserDoc } from "../types/firestore.js";

export const createUserDoc = (
  email: string,
  overrides: Partial<UserDoc> = {},
): UserDoc => ({
  id: overrides.id ?? "",
  email,
  emailVerified: overrides.emailVerified ?? true,
  ...(overrides.avatarUrl ? { avatarUrl: overrides.avatarUrl } : {}),
  ...(overrides.dateOfBirth ? { dateOfBirth: overrides.dateOfBirth } : {}),
  ...(overrides.username ? { username: overrides.username } : {}),
  queueStatus: overrides.queueStatus ?? "idle",
  ...(overrides.teamId ? { teamId: overrides.teamId } : {}),
  ...(overrides.currentMatchupId ? { currentMatchupId: overrides.currentMatchupId } : {}),
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
});
