// Augment validation and effects functions
export const validateAugment = (augment: any, lineup: any[]) => {
  if (!augment || !augment.prerequisites) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const activePlayers = lineup
    .filter((slot) => slot.player !== null)
    .map((slot) => slot.player);

  let qualifyingPlayers: any[] = [];
  let allPrerequisitesMet = true;

  for (const prerequisite of augment.prerequisites) {
    const result = evaluatePrerequisite(prerequisite, activePlayers);

    if (!result.isValid) {
      allPrerequisitesMet = false;
      break;
    }

    if (qualifyingPlayers.length === 0) {
      qualifyingPlayers = result.qualifyingPlayers;
    } else {
      // Intersection: only keep players who qualify for all prerequisites
      qualifyingPlayers = qualifyingPlayers.filter((player: any) =>
        result.qualifyingPlayers.some((qp: any) => qp.id === player.id),
      );
    }
  }

  const hasEnoughPlayers =
    qualifyingPlayers.length >= (augment.playerCount || 0);

  return {
    isValid: allPrerequisitesMet && hasEnoughPlayers,
    qualifyingPlayers,
  };
};

const evaluatePrerequisite = (prerequisite: any, players: any[]) => {
  const { condition, type } = prerequisite;

  switch (type) {
    case "statThreshold":
      return evaluateStatThreshold(condition, players);
    case "positionRequirement":
      return evaluatePositionRequirement(condition, players);
    case "budgetThreshold":
      return evaluateBudgetThreshold(condition, players);
    default:
      return { isValid: false, qualifyingPlayers: [] };
  }
};

const evaluateStatThreshold = (condition: any, players: any[]) => {
  const { stat, operator, value, count } = condition;

  if (!stat || !operator || value === undefined) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const qualifyingPlayers = players.filter((player: any) => {
    const playerStatValue = getPlayerStatValue(player, stat);
    if (playerStatValue === null) return false;
    return evaluateCondition(playerStatValue, operator, value);
  });

  return {
    isValid: qualifyingPlayers.length >= count,
    qualifyingPlayers,
  };
};

const evaluatePositionRequirement = (condition: any, players: any[]) => {
  const { position, count } = condition;

  if (!position || position.length === 0) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const qualifyingPlayers = players.filter((player: any) =>
    player.positions?.some((pos: string) => position.includes(pos)),
  );

  return {
    isValid: qualifyingPlayers.length >= count,
    qualifyingPlayers,
  };
};

const evaluateBudgetThreshold = (condition: any, players: any[]) => {
  const { operator, value } = condition;

  if (!operator || value === undefined) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const totalSalary = players.reduce(
    (sum: number, player: any) => sum + (player.salary || 0),
    0,
  );
  const isValid = evaluateCondition(totalSalary, operator, value);

  return {
    isValid,
    qualifyingPlayers: isValid ? players : [],
  };
};

const getPlayerStatValue = (player: any, stat: string): number | null => {
  const { averageStats } = player;
  if (!averageStats) return null;

  switch (stat) {
    case "points":
      return averageStats.points;
    case "rebounds":
      return averageStats.rebounds;
    case "assists":
      return averageStats.assists;
    case "steals":
      return averageStats.steals;
    case "blocks":
      return averageStats.blocks;
    case "turnovers":
      return averageStats.turnovers;
    case "minutes":
      return averageStats.minutes;
    default:
      return null;
  }
};

const evaluateCondition = (
  playerValue: number,
  operator: string,
  threshold: number,
): boolean => {
  switch (operator) {
    case ">=":
      return playerValue >= threshold;
    case ">":
      return playerValue > threshold;
    case "<=":
      return playerValue <= threshold;
    case "<":
      return playerValue < threshold;
    case "=":
      return playerValue === threshold;
    default:
      return false;
  }
};

export const applyAugmentEffects = (
  baseFantasyPoints: number,
  gameStats: any,
  playerId: string,
  qualifyingPlayers: any[],
  augment: any,
): number => {
  if (!augment || !augment.isActive || !qualifyingPlayers || !augment.effects) {
    return baseFantasyPoints;
  }

  const playerQualifies = qualifyingPlayers.some((p: any) => p.id === playerId);
  if (!playerQualifies) {
    return baseFantasyPoints;
  }

  if (!augment.effects || augment.effects.length === 0) {
    return baseFantasyPoints;
  }

  let totalPoints = baseFantasyPoints;

  augment.effects.forEach((effect: any) => {
    effect.statBoosts.forEach((boost: any) => {
      const statValue = getGameStatValue(gameStats, boost.stat);
      const baseStatMultiplier = getBaseStatMultiplier(boost.stat);

      const additionalBoost =
        statValue * baseStatMultiplier * (boost.multiplier - 1);
      totalPoints += additionalBoost;
    });
  });

  return totalPoints;
};

const getGameStatValue = (stats: any, stat: string): number => {
  switch (stat) {
    case "points":
      return stats.points || 0;
    case "rebounds":
      return stats.rebounds || 0;
    case "assists":
      return stats.assists || 0;
    case "steals":
      return stats.steals || 0;
    case "blocks":
      return stats.blocks || 0;
    case "turnovers":
      return stats.turnovers || 0;
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
