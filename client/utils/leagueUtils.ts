import { League, PlayoffTeams } from "@/types/league";

const LARGE_LEAGUE_MIN_TEAMS = 10;

export const getPlayoffTeams = (numberOfTeams: number): PlayoffTeams =>
  numberOfTeams >= LARGE_LEAGUE_MIN_TEAMS ? 6 : 4;

export const isLeagueClosed = (league: League, today: string): boolean =>
  league.status !== "forming" || today > league.deadline;
