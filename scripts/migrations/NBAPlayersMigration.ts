import { BalldontlieAPI } from "@balldontlie/sdk";
import { Firestore } from "firebase-admin/firestore";
import { BaseMigration } from "./BaseMigration.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Import types from players
 */
import type {
  NBAPlayer,
  PlayerGameLog,
  PlayerAverageStats,
} from "../types/players.ts";

const CURRENT_SEASON = 2025;

/**
 * Raw player data from Ball Don't Lie API
 */
interface RawPlayerData {
  player: any;
  averages: any;
  gamelog: any[];
}

/**
 * Calculate fantasy points based on stats
 */
const calculateFantasyPoints = (stats: {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  threePointersMade: number;
}): number => {
  return (
    stats.points +
    stats.rebounds +
    stats.assists * 2 +
    stats.steals * 4 +
    stats.blocks * 4 +
    stats.fieldGoalsMade * 2 +
    stats.freeThrowsMade +
    stats.threePointersMade -
    stats.turnovers * 2 -
    stats.fieldGoalsAttempted -
    stats.freeThrowsAttempted
  );
};

/**
 * Calculate salary based on fantasy points
 */
const calculateSalary = (fantasyPoints: number): number => {
  if (
    fantasyPoints === undefined ||
    fantasyPoints === null ||
    isNaN(fantasyPoints) ||
    fantasyPoints < 0
  ) {
    return 1000000; // Minimum $1M
  }

  const linearScale = (
    actualFpts: number,
    minFpts: number,
    maxFpts: number,
    minSalary: number,
    maxSalary: number
  ): number => {
    return (
      (minSalary +
        ((actualFpts - minFpts) * (maxSalary - minSalary)) /
          (maxFpts - minFpts)) *
      1000000
    );
  };

  const roundToHundredThousand = (value: number): number => {
    return Math.round(value / 100000) * 100000;
  };

  let salary: number;
  if (fantasyPoints >= 50) {
    salary = (35 + (fantasyPoints - 50) * 0.67) * 1000000;
  } else if (fantasyPoints >= 35) {
    salary = linearScale(fantasyPoints, 35, 50, 25, 35);
  } else if (fantasyPoints >= 25) {
    salary = linearScale(fantasyPoints, 25, 35, 15, 25);
  } else if (fantasyPoints >= 15) {
    salary = linearScale(fantasyPoints, 15, 25, 10, 15);
  } else if (fantasyPoints >= 5) {
    salary = linearScale(fantasyPoints, 5, 15, 5, 10);
  } else {
    salary = linearScale(fantasyPoints, 0, 5, 1, 5);
  }

  return roundToHundredThousand(salary);
};

/**
 * NBA Players Migration
 * Fetches player data from Ball Don't Lie API and headshots from JSON file
 */
export class NBAPlayersMigration extends BaseMigration<NBAPlayer> {
  private api: BalldontlieAPI;
  private apiKey: string;
  private headshots: Map<string, string>;
  private positions: Map<string, string[]>;

  constructor(db: Firestore, apiKey: string) {
    super(db, "nbaPlayers");
    this.api = new BalldontlieAPI({ apiKey });
    this.apiKey = apiKey;
    this.headshots = this.loadHeadshots();
    this.positions = new Map();
  }

  /**
   * Load headshots from JSON file
   */
  private loadHeadshots(): Map<string, string> {
    try {
      const headshotsPath = join(
        __dirname,
        "..",
        "data",
        "nbaPlayerHeadshots.json"
      );
      const headshotsData: Record<string, string> = JSON.parse(
        readFileSync(headshotsPath, "utf8")
      );

      // Create a map for quick lookup: playerId -> URL
      const headshotMap = new Map<string, string>();
      Object.entries(headshotsData).forEach(([playerId, url]) => {
        headshotMap.set(playerId, url);
      });

      console.log(`   ✓ Loaded ${headshotMap.size} headshots from file`);
      return headshotMap;
    } catch (error) {
      console.warn(
        "⚠️  Could not load headshots file:",
        error instanceof Error ? error.message : String(error)
      );
      return new Map();
    }
  }

  /**
   * Load positions from JSON file
   */
  private loadPositions(): Map<string, string[]> {
    try {
      const positionsPath = join(
        __dirname,
        "..",
        "data",
        "nbaPlayerPositions.json"
      );
      const positionsData: Record<string, string[]> = JSON.parse(
        readFileSync(positionsPath, "utf8")
      );

      const positionsMap = new Map<string, string[]>();
      Object.entries(positionsData).forEach(([playerId, positions]) => {
        // Filter out placeholder positions
        if (!positions.includes("POSITION_NEEDED")) {
          positionsMap.set(playerId, positions);
        }
      });

      console.log(`   ✓ Loaded ${positionsMap.size} positions from file`);
      return positionsMap;
    } catch (error) {
      console.warn(
        "⚠️  Could not load positions file:",
        error instanceof Error ? error.message : String(error)
      );
      return new Map();
    }
  }

  /**
   * Fetch all active players from Ball Don't Lie API
   */
  private async fetchActivePlayers(): Promise<any[]> {
    const players: any[] = [];
    let cursor: number | undefined = undefined;

    do {
      const response = await this.api.nba.getActivePlayers({
        cursor,
        per_page: 100,
      });

      if (response.data && response.data.length > 0) {
        players.push(...response.data);
      }

      cursor = response.meta?.next_cursor;
    } while (cursor);

    return players;
  }

  /**
   * Fetch season averages for players
   */
  private async fetchSeasonAverages(
    playerIds: number[]
  ): Promise<Map<string, any>> {
    const allAverages: any[] = [];
    const chunkSize = 25;

    for (let i = 0; i < playerIds.length; i += chunkSize) {
      const chunk = playerIds.slice(i, i + chunkSize);
      const queryParams = chunk.map((id) => `player_ids[]=${id}`).join("&");
      const url = `https://api.balldontlie.io/v1/season_averages/general?season=${CURRENT_SEASON}&season_type=regular&type=base&${queryParams}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      const data = (await response.json()) as { data?: any[] };
      if (data.data) {
        allAverages.push(...data.data);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Create a map for quick lookup
    const averagesMap = new Map<string, any>();
    allAverages.forEach((avg) => {
      averagesMap.set(avg.player.id.toString(), avg);
    });

    return averagesMap;
  }

  /**
   * Fetch last 10 game logs for a player
   */
  private async fetchPlayerGameLogs(
    playerId: number
  ): Promise<PlayerGameLog[]> {
    try {
      const response = await this.api.nba.getStats({
        seasons: [CURRENT_SEASON],
        player_ids: [playerId],
        per_page: 10,
      });

      if (!response.data || response.data.length === 0) {
        return [];
      }

      return response.data.map((game: any) => ({
        gameId: game.game.id,
        date: game.game.date,
        teamId: game.team.id,
        homeTeamId: game.game.home_team_id,
        visitorTeamId: game.game.visitor_team_id,
        minutes: game.min || "0",
        points: game.pts || 0,
        rebounds: game.reb || 0,
        assists: game.ast || 0,
        steals: game.stl || 0,
        blocks: game.blk || 0,
        turnovers: game.turnover || 0,
        personalFouls: game.pf || 0,
        fieldGoalsMade: game.fgm || 0,
        fieldGoalsAttempted: game.fga || 0,
        fieldGoalPercentage: game.fg_pct || 0,
        freeThrowsMade: game.ftm || 0,
        freeThrowsAttempted: game.fta || 0,
        freeThrowPercentage: game.ft_pct || 0,
        threePointersMade: game.fg3m || 0,
        threePointersAttempted: game.fg3a || 0,
        threePointerPercentage: game.fg3_pct || 0,
        fantasyPoints: calculateFantasyPoints({
          points: game.pts || 0,
          rebounds: game.reb || 0,
          assists: game.ast || 0,
          steals: game.stl || 0,
          blocks: game.blk || 0,
          turnovers: game.turnover || 0,
          fieldGoalsMade: game.fgm || 0,
          fieldGoalsAttempted: game.fga || 0,
          freeThrowsMade: game.ftm || 0,
          freeThrowsAttempted: game.fta || 0,
          threePointersMade: game.fg3m || 0,
        }),
      }));
    } catch (error) {
      console.warn(
        `Could not fetch game logs for player ${playerId}:`,
        error instanceof Error ? error.message : String(error)
      );
      return [];
    }
  }

  /**
   * Fetch all data needed for players
   */
  async fetchData(): Promise<RawPlayerData[]> {
    console.log("Fetching active players...");
    const players = await this.fetchActivePlayers();
    console.log(`Found ${players.length} active players`);

    console.log("Loading player positions...");
    this.positions = this.loadPositions();

    console.log("Fetching season averages...");
    const playerIds = players.map((p) => p.id);
    const averagesMap = await this.fetchSeasonAverages(playerIds);
    console.log(`Found averages for ${averagesMap.size} players`);

    // Skip fetching game logs - use empty arrays for migrations
    console.log("Skipping game logs (using empty arrays for migrations)...");
    const gameLogsMap = new Map<string, PlayerGameLog[]>();
    players.forEach((player) => {
      gameLogsMap.set(player.id.toString(), []);
    });
    console.log(`Using empty game logs for ${gameLogsMap.size} players`);

    return players.map((player) => ({
      player,
      averages: averagesMap.get(player.id.toString()),
      gamelog: gameLogsMap.get(player.id.toString()) || [],
    }));
  }

  /**
   * Transform raw player data into NBAPlayer format
   */
  transform(rawData: RawPlayerData): NBAPlayer {
    const { player, averages, gamelog } = rawData;

    // Get headshot URL by player ID
    const headshotURL = this.headshots.get(player.id.toString()) || "";

    // Default stats if no averages available
    const defaultStats: PlayerAverageStats = {
      minutes: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      fieldGoalPercentage: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      freeThrowPercentage: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      threePointerPercentage: 0,
      fantasyPoints: 0,
    };

    let averageStats = defaultStats;
    let gamesPlayed = 0;

    if (averages && averages.stats) {
      const stats = averages.stats;
      averageStats = {
        minutes: stats.min || 0,
        points: stats.pts || 0,
        rebounds: stats.reb || 0,
        assists: stats.ast || 0,
        steals: stats.stl || 0,
        blocks: stats.blk || 0,
        turnovers: stats.tov || 0,
        fieldGoalsMade: stats.fgm || 0,
        fieldGoalsAttempted: stats.fga || 0,
        fieldGoalPercentage: stats.fg_pct || 0,
        freeThrowsMade: stats.ftm || 0,
        freeThrowsAttempted: stats.fta || 0,
        freeThrowPercentage: stats.ft_pct || 0,
        threePointersMade: stats.fg3m || 0,
        threePointersAttempted: stats.fg3a || 0,
        threePointerPercentage: stats.fg3_pct || 0,
        fantasyPoints: 0, // Will be calculated
      };

      // Calculate fantasy points
      averageStats.fantasyPoints = parseFloat(
        calculateFantasyPoints(averageStats).toFixed(1)
      );

      gamesPlayed = stats.gp || 0;
    }

    const salary = calculateSalary(averageStats.fantasyPoints);

    // Get positions from NBA.com API cache, fallback to Ball Don't Lie generic positions
    const nbaPositions = this.positions.get(player.id.toString());
    const positions =
      nbaPositions && nbaPositions.length > 0
        ? nbaPositions
        : player.position
        ? player.position.split("-").map((p: string) => p.trim())
        : [];

    return {
      playerId: player.id.toString(),
      teamId: player.team.id.toString(),
      teamAbbreviation: player.team.abbreviation || "",
      firstName: player.first_name,
      lastName: player.last_name,
      firstNameLower: player.first_name.toLowerCase(),
      lastNameLower: player.last_name.toLowerCase(),
      fullNameLower: `${player.first_name} ${player.last_name}`.toLowerCase(),
      positions,
      height: player.height || "",
      weight: player.weight || "",
      jerseyNumber: player.jersey_number || "",
      country: player.country || "",
      headshotURL,
      gamesPlayed,
      averageStats,
      salary,
      gamelog: gamelog || [],
    };
  }

  /**
   * Validate player data
   */
  validate(player: NBAPlayer): boolean {
    return !!(
      player.playerId &&
      player.teamId &&
      player.firstName &&
      player.lastName &&
      typeof player.salary === "number" &&
      player.averageStats &&
      Array.isArray(player.gamelog)
    );
  }
}
