import type { GameInfo, GameStats } from "../shared/types";

export type LiveData = Record<
  number,
  {
    gameInfo: GameInfo;
    gameStats: GameStats;
  }
>;
