import {
  addDays,
  firstWeekStart,
  lastFullWeekStart,
  minimumSeasonWeeks,
  PlayoffTeams,
  playoffTeamsFor,
  playoffWeeksFor,
  SeasonConfig,
} from "./season";
import { MIN_TEAMS } from "./types";

// Pure schedule generation: no Firestore, so it can be unit-tested directly.
// `generateLeagueSchedules` runs it when a league's registration deadline passes.

export type RandomSource = () => number;

export type ScheduledPairing = {
  week: number;
  weekStart: string;
  homeTeamId: string;
  awayTeamId: string;
};

export type LeagueSchedule = {
  pairings: ScheduledPairing[];
  regularSeasonWeeks: number;
  playoffStartWeek: number;
  playoffTeams: PlayoffTeams;
};

export type ScheduleFailure = "too-few-teams" | "season-too-short";

export type ScheduleResult =
  | { ok: true; schedule: LeagueSchedule }
  | { ok: false; reason: ScheduleFailure };

export type ScheduleInput = {
  teamIds: string[];
  season: SeasonConfig;
  deadline: string;
  random: RandomSource;
};

type Pairing = { homeTeamId: string; awayTeamId: string };

const DAYS_PER_WEEK = 7;
const MS_PER_WEEK = DAYS_PER_WEEK * 24 * 60 * 60 * 1000;

const weeksBetween = (from: string, to: string): number =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      MS_PER_WEEK,
  );

// Fisher–Yates on a copy, so the input order is left alone.
export const shuffle = <T>(items: readonly T[], random: RandomSource): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// One full round-robin cycle using the circle method: every team meets every
// other team exactly once. An odd count gets a `null` slot, and whoever draws it
// has a bye that round (no pairing). Slot 0 stays fixed and the rest rotate, so
// the top row is home: each rotating team spends about half its rounds there,
// and the fixed team alternates. Home and away games stay within one of each
// other.
export const roundRobinCycle = (teamIds: readonly string[]): Pairing[][] => {
  const slots: Array<string | null> =
    teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null];
  const slotCount = slots.length;
  const rounds: Pairing[][] = [];

  for (let round = 0; round < slotCount - 1; round++) {
    const pairings: Pairing[] = [];

    for (let i = 0; i < slotCount / 2; i++) {
      const top = slots[i];
      const bottom = slots[slotCount - 1 - i];
      if (top === null || bottom === null) continue;

      const topIsHome = i === 0 ? round % 2 === 0 : true;
      pairings.push(
        topIsHome
          ? { homeTeamId: top, awayTeamId: bottom }
          : { homeTeamId: bottom, awayTeamId: top },
      );
    }

    rounds.push(pairings);
    // Rotate every slot except the first one place clockwise.
    slots.splice(1, 0, slots.pop() ?? null);
  }

  return rounds;
};

const swapSides = (pairing: Pairing): Pairing => ({
  homeTeamId: pairing.awayTeamId,
  awayTeamId: pairing.homeTeamId,
});

// Builds the regular season and reserves the playoff weeks. Week 1 is the first
// Monday after registration closes (or the NBA season start, if later). Playoffs
// take the last full fantasy weeks of the NBA regular season, and the regular
// season fills every week before them by repeating the round-robin cycle, with
// sides swapped on every other cycle. A season too short for the minimum the
// league was created against (one full cycle of a MIN_TEAMS league plus the
// playoffs) can't be scheduled.
export const generateLeagueSchedule = ({
  teamIds,
  season,
  deadline,
  random,
}: ScheduleInput): ScheduleResult => {
  if (teamIds.length < MIN_TEAMS) {
    return { ok: false, reason: "too-few-teams" };
  }

  const playoffTeams = playoffTeamsFor(teamIds.length);
  const weekOneStart = firstWeekStart(season, deadline);
  const totalWeeks = weeksBetween(weekOneStart, lastFullWeekStart(season)) + 1;

  if (totalWeeks < minimumSeasonWeeks(playoffTeams)) {
    return { ok: false, reason: "season-too-short" };
  }

  const regularSeasonWeeks = totalWeeks - playoffWeeksFor(playoffTeams);
  const cycle = roundRobinCycle(shuffle(teamIds, random));
  const pairings: ScheduledPairing[] = [];

  for (let index = 0; index < regularSeasonWeeks; index++) {
    const week = index + 1;
    const weekStart = addDays(weekOneStart, index * DAYS_PER_WEEK);
    const isSwappedCycle = Math.floor(index / cycle.length) % 2 === 1;

    for (const pairing of cycle[index % cycle.length]) {
      pairings.push({
        week,
        weekStart,
        ...(isSwappedCycle ? swapSides(pairing) : pairing),
      });
    }
  }

  return {
    ok: true,
    schedule: {
      pairings,
      regularSeasonWeeks,
      playoffStartWeek: regularSeasonWeeks + 1,
      playoffTeams,
    },
  };
};
