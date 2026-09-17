import type { NbaTeamFixture } from "../fixtures/nbaTeams.js";

export const DEFAULT_NBA_TEAMS = [
  { id: "lal", name: "Los Angeles Lakers", abbreviation: "LAL" },
  { id: "mil", name: "Milwaukee Bucks", abbreviation: "MIL" },
] satisfies readonly NbaTeamFixture[];
