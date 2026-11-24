import { PlayerAverageStats, RawStatLine } from "@/types/player";

// Normalizes every stat key to a number, reading missing or null values as 0.
export const toPlayerAverageStats = (
  stats: RawStatLine,
): PlayerAverageStats => ({
  assists: stats?.assists ?? 0,
  blocks: stats?.blocks ?? 0,
  fantasyPoints: stats?.fantasyPoints ?? 0,
  minutes: stats?.minutes ?? 0,
  points: stats?.points ?? 0,
  rebounds: stats?.rebounds ?? 0,
  steals: stats?.steals ?? 0,
  turnovers: stats?.turnovers ?? 0,
});
