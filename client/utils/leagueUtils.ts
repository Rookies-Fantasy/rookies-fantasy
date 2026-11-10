import * as yup from "yup";
import { League } from "@/types/league";

// League configuration constants. Mirrored server-side in
// `server/functions/src/leagues/types.ts`.
export const MIN_BUDGET = 150_000_000;
export const MAX_BUDGET = 250_000_000;
export const BUDGET_STEP = 25_000_000;
export const MIN_TEAMS = 4;
export const MAX_TEAMS = 20;
export const TEAMS_STEP = 2;
export const MAX_LEAGUE_NAME_LENGTH = 50;

// The owner-chosen league settings, shared by the create and edit screens.
// Editing passes a higher `minTeams` so the count can't drop below the teams
// already in the league.
export const buildLeagueSettingsSchema = (minTeams: number = MIN_TEAMS) =>
  yup.object({
    leagueName: yup
      .string()
      .trim()
      .required("League name is required")
      .max(
        MAX_LEAGUE_NAME_LENGTH,
        `League name must be at most ${MAX_LEAGUE_NAME_LENGTH} characters`,
      ),
    numberOfTeams: yup
      .number()
      .required("Number of teams is required")
      .min(minTeams, `Minimum teams must be at least ${minTeams}`)
      .max(MAX_TEAMS, `Maximum teams is ${MAX_TEAMS}`)
      .typeError("Must be a number"),
    budget: yup
      .number()
      .required("Budget is required")
      .min(MIN_BUDGET, `Budget must be at least $${MIN_BUDGET / 1_000_000}M`)
      .max(
        MAX_BUDGET,
        `Budget must be no more than $${MAX_BUDGET / 1_000_000}M`,
      )
      .typeError("Must be a number"),
  });

export const leagueSettingsSchema = buildLeagueSettingsSchema();

export type LeagueSettingsFormData = yup.InferType<typeof leagueSettingsSchema>;

export const formatBudget = (value: number): string =>
  `$${(value / 1_000_000).toFixed(0)}M`;

// memberCount is only a counter, so the membership arrays are checked too.
// Matches `membershipOf` in the server's league validation.
export const getLeagueMembership = (league: League): number =>
  Math.max(league.memberCount, league.teamIds.length, league.userIds.length);

export const isLeagueOwner = (league: League, userId: string): boolean =>
  userId.length > 0 && league.creatorUserId === userId;

// The budget seeds each team's starting balance, so it is locked once anyone
// besides the owner has joined.
export const isLeagueBudgetLocked = (league: League): boolean =>
  getLeagueMembership(league) > 1;

// The smallest team count the league can be edited down to, kept on the
// stepper's scale so the stepper never offers an invalid value.
export const getMinEditableTeams = (league: League): number => {
  const membership = getLeagueMembership(league);
  if (membership <= MIN_TEAMS) return MIN_TEAMS;

  const stepsAboveMin = Math.ceil((membership - MIN_TEAMS) / TEAMS_STEP);
  return Math.min(MAX_TEAMS, MIN_TEAMS + stepsAboveMin * TEAMS_STEP);
};
