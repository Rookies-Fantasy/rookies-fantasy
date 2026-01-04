import type { PlayerAverageStats } from "./players.js";

export type NBAPlayerAverages = {
  playerId: string;
  seasonId: string;
  gamesPlayed: number;
  averageStats: PlayerAverageStats;
};
