import { createLeague } from "./createLeague.js";
import { joinLeague } from "./joinLeague.js";
import { leagueStandings } from "./leagueStandings.js";
import type { Feature } from "./support.js";

// One entry per file in .claude/skills/verify-rookies-fantasy/features/.
export const FEATURES: Feature[] = [createLeague, joinLeague, leagueStandings];
