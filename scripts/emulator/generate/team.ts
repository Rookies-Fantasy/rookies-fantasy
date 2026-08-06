import { TeamLineupSlot } from "../../../client/types/team.js";
import type { TeamDoc } from "../types/firestore.js";

const defaultLineup: TeamLineupSlot[] = [
  { position: "PG", player: null },
  { position: "SG", player: null },
  { position: "SF", player: null },
  { position: "PF", player: null },
  { position: "C", player: null },
  { position: "UTIL1", player: null },
  { position: "UTIL2", player: null },
  { position: "UTIL3", player: null },
];

export const createTeamDoc = (overrides: Partial<TeamDoc> = {}): TeamDoc => ({
  id: overrides.id ?? "",
  name: overrides.name ?? "Test Team",
  abbreviation: overrides.abbreviation ?? "TST",
  logoUrl: overrides.logoUrl ?? "https://via.placeholder.com/150",
  balance: overrides.balance ?? 150000000,
  lineup: overrides.lineup ?? defaultLineup,
  bench: overrides.bench ?? [],
  record: overrides.record ?? { wins: 0, losses: 0, draws: 0 },
  augmentId: overrides.augmentId,
  augment: overrides.augment,
  hasUserChanges: overrides.hasUserChanges ?? false,
  isLeagueTeam: overrides.isLeagueTeam ?? false,
  createdAt: overrides.createdAt ?? new Date(),
  updatedAt: overrides.updatedAt ?? new Date(),
  matchupId: overrides.matchupId,
});
