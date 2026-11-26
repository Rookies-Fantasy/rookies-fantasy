import * as yup from "yup";
import {
  DeadlineWindow,
  League,
  LeagueDeadlineBounds,
  LEAGUE_STATUSES,
  LeagueStatus,
  PlayoffTeams,
} from "@/types/league";
import { Team } from "@/types/team";
import { formatDeadlineDate } from "@/utils/dateUtils";
import { isNil } from "@/utils/jsUtils";

// League configuration constants. Mirrored server-side in
// `server/functions/src/leagues/types.ts`.
export const MIN_BUDGET = 150_000_000;
export const MAX_BUDGET = 250_000_000;
export const BUDGET_STEP = 25_000_000;
export const MIN_TEAMS = 4;
export const MAX_TEAMS = 20;
export const TEAMS_STEP = 2;
export const MAX_LEAGUE_NAME_LENGTH = 50;

const LARGE_LEAGUE_MIN_TEAMS = 10;

export const getPlayoffTeams = (numberOfTeams: number): PlayoffTeams =>
  numberOfTeams >= LARGE_LEAGUE_MIN_TEAMS ? 6 : 4;

export const toLeagueStatus = (value: string): LeagueStatus =>
  LEAGUE_STATUSES.find((status) => status === value) ?? "forming";

// Registration closes when the deadline day ends or once the league has left
// `forming`. Matches `isRegistrationClosed` in the server's league validation.
export const isLeagueClosed = (league: League, today: string): boolean =>
  league.status !== "forming" || today > league.deadline;

export const isLeagueCancelled = (league: League): boolean =>
  league.status === "unscheduled";

export const isLeagueReopenable = (league: League): boolean =>
  league.status === "forming" || league.status === "unscheduled";

export const getDeadlineRange = (
  bounds: LeagueDeadlineBounds | null,
  numberOfTeams: number,
): DeadlineWindow | null =>
  isNil(bounds) ? null : bounds.byPlayoffTeams[getPlayoffTeams(numberOfTeams)];

export const formatRegistrationCloses = (deadline: string): string =>
  `Registration closes ${formatDeadlineDate(deadline)} at midnight PT`;

export const getEffectiveDeadline = (
  pickedDeadline: string,
  range: DeadlineWindow | null,
): string => {
  if (isNil(range)) return "";
  if (pickedDeadline === "") return range.default;
  return pickedDeadline > range.latest ? range.latest : pickedDeadline;
};

export const formatBudget = (value: number): string =>
  `$${(value / 1_000_000).toFixed(0)}M`;

// What a team's players cost: every salary in its lineup and on its bench. A
// player's salary leaves the balance when they join the lineup (see
// `addPlayerToLineup` in state/slices/teamSlice.ts) and stays out while they
// sit on the bench. Mirrors `toRosterCost` in the server's league validation.
export const getRosterCost = (team: Pick<Team, "lineup" | "bench">): number =>
  [...team.lineup, ...team.bench].reduce(
    (cost, slot) => cost + (slot.player?.salary ?? 0),
    0,
  );

export const isBudgetCoveringRoster = (
  budget: number,
  rosterCost: number,
): boolean => budget >= rosterCost;

export const getRosterOverBudgetMessage = (rosterCost: number): string =>
  `Your roster costs ${formatBudget(rosterCost)}, so the budget can't be lower than that`;

// The smallest budget the owner can pick: the lowest step on the stepper's
// scale that still pays for their roster.
export const getMinEditableBudget = (rosterCost: number): number => {
  if (rosterCost <= MIN_BUDGET) return MIN_BUDGET;

  const stepsAboveMin = Math.ceil((rosterCost - MIN_BUDGET) / BUDGET_STEP);
  return Math.min(MAX_BUDGET, MIN_BUDGET + stepsAboveMin * BUDGET_STEP);
};

// A team's balance under a new budget: what is left after paying for its
// players. Matches the balance the server writes when the budget changes.
export const getBalanceForBudget = (
  budget: number,
  team: Pick<Team, "lineup" | "bench">,
): number => budget - getRosterCost(team);

// The owner-chosen league settings, shared by the create and edit screens.
// Editing passes a higher `minTeams` so the count can't drop below the teams
// already in the league, and the owner's `rosterCost` so the budget can't drop
// below what their players already cost.
export const buildLeagueSettingsSchema = (
  minTeams: number = MIN_TEAMS,
  rosterCost: number = 0,
) =>
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
      .test("covers-roster", getRosterOverBudgetMessage(rosterCost), (budget) =>
        isBudgetCoveringRoster(budget, rosterCost),
      )
      .typeError("Must be a number"),
  });

export const leagueSettingsSchema = buildLeagueSettingsSchema();

export type LeagueSettingsFormData = yup.InferType<typeof leagueSettingsSchema>;

// memberCount is only a counter, so the membership arrays are checked too.
// Matches `membershipOf` in the server's league validation.
export const getLeagueMembership = (league: League): number =>
  Math.max(league.memberCount, league.teamIds.length, league.userIds.length);

export const isLeagueOwner = (league: League, userId: string): boolean =>
  userId.length > 0 && league.creatorUserId === userId;

// The budget seeds each team's starting balance, so it is locked once anyone
// besides the owner has joined, and registration closing locks it too (see
// `isLeagueClosed`). Until then it can still change, but never below what the
// owner's roster costs (see `getMinEditableBudget`).
export const isLeagueBudgetLocked = (league: League): boolean =>
  getLeagueMembership(league) > 1;

// The team whose balance follows the budget: while the budget is editable the
// owner is the only member, so the league's only team is theirs. Mirrors
// `getOwnerTeamId` in the server's league validation.
export const getOwnerTeamId = (league: League): string | null =>
  league.teamIds.length === 1 ? league.teamIds[0] : null;

// The smallest team count the league can be edited down to, kept on the
// stepper's scale so the stepper never offers an invalid value.
export const getMinEditableTeams = (league: League): number => {
  const membership = getLeagueMembership(league);
  if (membership <= MIN_TEAMS) return MIN_TEAMS;

  const stepsAboveMin = Math.ceil((membership - MIN_TEAMS) / TEAMS_STEP);
  return Math.min(MAX_TEAMS, MIN_TEAMS + stepsAboveMin * TEAMS_STEP);
};
