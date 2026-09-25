import { Firestore } from "firebase-admin/firestore";
import { BaseMigration } from "./BaseMigration.js";
import type { NBAPlayerAverages } from "../types/playerAverages.js";
import type { NBAPlayer } from "../types/players.js";

const CURRENT_SEASON = "2025";

/**
 * NBA Player Averages Migration
 * Extracts season averages from the nbaPlayers collection data
 */
export class NBAPlayerAveragesMigration extends BaseMigration<NBAPlayerAverages> {
  private playersData: NBAPlayer[];

  constructor(db: Firestore, playersData: NBAPlayer[]) {
    super(db, "nbaPlayerAverages");
    this.playersData = playersData;
  }

  /**
   * Use the already-fetched players data
   */
  async fetchData(): Promise<NBAPlayer[]> {
    console.log(
      `Using ${this.playersData.length} players from nbaPlayers migration`
    );
    return this.playersData;
  }

  /**
   * Transform player data into player averages format
   */
  transform(player: NBAPlayer): NBAPlayerAverages {
    return {
      playerId: player.playerId,
      seasonId: CURRENT_SEASON,
      gamesPlayed: player.gamesPlayed,
      averageStats: player.averageStats,
    };
  }

  /**
   * Validate player averages data
   */
  validate(averages: NBAPlayerAverages): boolean {
    return !!(
      averages.playerId &&
      averages.seasonId &&
      typeof averages.gamesPlayed === "number" &&
      averages.averageStats &&
      typeof averages.averageStats.points === "number"
    );
  }
}
