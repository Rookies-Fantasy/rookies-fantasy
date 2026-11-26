import {
  DeadlineWindow,
  League,
  LEAGUE_STATUSES,
  LeagueStatus,
  PlayoffTeams,
} from "@/types/league";
import { formatDeadlineDate } from "@/utils/dateUtils";
import { isNil } from "@/utils/jsUtils";

const LARGE_LEAGUE_MIN_TEAMS = 10;

export const getPlayoffTeams = (numberOfTeams: number): PlayoffTeams =>
  numberOfTeams >= LARGE_LEAGUE_MIN_TEAMS ? 6 : 4;

export const toLeagueStatus = (value: string): LeagueStatus =>
  LEAGUE_STATUSES.find((status) => status === value) ?? "forming";

export const isLeagueClosed = (league: League, today: string): boolean =>
  league.status !== "forming" || today > league.deadline;

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
