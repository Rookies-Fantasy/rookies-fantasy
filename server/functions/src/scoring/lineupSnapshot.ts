import type {
  GameInfo,
  GameStats,
  LineupSnapshotItem,
  TeamLineupSlot,
} from "../shared/types";
import { applyAugmentEffects, validateAugment } from "./augments";

export const getLineupSnapshot = (
  lineup: TeamLineupSlot[],
  gamelogMap: Record<string, any>,
  augment?: any,
): LineupSnapshotItem[] => {
  if (!lineup || !Array.isArray(lineup)) return [];

  const { isValid, qualifyingPlayers } = validateAugment(augment, lineup);

  console.log(
    `Augment validation for team: isValid=${isValid}, qualifyingCount=${qualifyingPlayers.length}`,
  );

  return lineup.flatMap((slot) => {
    if (!slot.player) return [];

    const playerId = slot.player.id;
    const latestGamelog = gamelogMap[playerId];
    const emptyGameStats: GameStats = {
      points: 0,
      assists: 0,
      rebounds: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fantasyPoints: 0,
      minutes: 0,
    };
    const emptyGameInfo: GameInfo = {
      gameStatus: false,
      opponent: "",
      gameDate: "",
      isHome: false,
    };
    const gameStats = latestGamelog ?? emptyGameStats;

    // TODO: Do we need to store the fantasy points? Or can we calculate it at runtime?
    // Calculate fantasy points with augment effects
    let fantasyPoints = gameStats.fantasyPoints;
    if (latestGamelog && isValid) {
      const baseFantasyPoints = latestGamelog.fantasyPoints;
      fantasyPoints = applyAugmentEffects(
        baseFantasyPoints,
        latestGamelog,
        playerId,
        qualifyingPlayers,
        augment,
      );

      console.log(
        `Player ${playerId}: base=${baseFantasyPoints}, augmented=${fantasyPoints}`,
      );
    }

    return {
      position: slot.position,
      playerSnapshot: {
        firstName: slot.player.firstName,
        lastName: slot.player.lastName,
        headshotUrl: slot.player.headshotUrl,
        positions: slot.player.positions,
        salary: slot.player.salary,
        id: playerId,
        gameInfo: latestGamelog?.gameInfo ?? emptyGameInfo,
        gameStats: {
          points: gameStats.points ?? 0,
          assists: gameStats.assists ?? 0,
          rebounds: gameStats.rebounds ?? 0,
          steals: gameStats.steals ?? 0,
          blocks: gameStats.blocks ?? 0,
          turnovers: gameStats.turnovers ?? 0,
          fantasyPoints: fantasyPoints ?? 0,
          minutes: gameStats.minutes ?? 0,
        },
      },
    };
  });
};
