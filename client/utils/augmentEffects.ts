import { Augment } from "@/types/augment";
import { Player } from "@/types/player";
import { GameStats } from "@/types/team";

export const applyAugmentEffects = (
  baseFantasyPoints: number,
  stats: GameStats,
  playerId: string,
  qualifyingPlayers: Player[] | undefined,
  augment: Augment | undefined,
): number => {
  if (!augment || !augment.isActive || !qualifyingPlayers) {
    return baseFantasyPoints;
  }

  const playerQualifies = qualifyingPlayers.some((p) => p.id === playerId);
  if (!playerQualifies) {
    return baseFantasyPoints;
  }

  if (!augment.effects || augment.effects.length === 0) {
    return baseFantasyPoints;
  }

  let totalPoints = baseFantasyPoints;

  augment.effects.forEach((effect) => {
    effect.statBoosts.forEach((boost) => {
      const statValue = getStatValue(stats, boost.stat);
      const baseStatMultiplier = getBaseStatMultiplier(boost.stat);

      const additionalBoost =
        statValue * baseStatMultiplier * (boost.multiplier - 1);
      totalPoints += additionalBoost;
    });
  });

  return totalPoints;
};

const getStatValue = (stats: GameStats, stat: string): number => {
  switch (stat) {
    case "points":
      return stats.pts;
    case "rebounds":
      return stats.reb;
    case "assists":
      return stats.ast;
    case "steals":
      return stats.stl;
    case "blocks":
      return stats.blk;
    case "turnovers":
      return stats.tov;
    // TODO: Add support for FG%, FT%, 3P%, etc. when available in GameStats
    default:
      return 0;
  }
};

const getBaseStatMultiplier = (stat: string): number => {
  switch (stat) {
    case "points":
      return 1;
    case "rebounds":
      return 1;
    case "assists":
      return 2;
    case "steals":
      return 3;
    case "blocks":
      return 3;
    case "turnovers":
      return -2;
    default:
      return 0;
  }
};
