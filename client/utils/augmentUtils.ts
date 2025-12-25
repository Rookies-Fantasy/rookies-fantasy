import { Augment, Prerequisite, Condition } from "@/types/augment";
import { Player } from "@/types/player";
import { LineupSlot, GameStats } from "@/types/team";

const STAT_MULTIPLIERS: Record<string, number> = {
  points: 1,
  rebounds: 1,
  assists: 2,
  steals: 3,
  blocks: 3,
  turnovers: -2,
};

export type ValidationResult = {
  isValid: boolean;
  qualifyingPlayers: Player[];
  unmetPrerequisites: string[];
  metPrerequisites: string[];
};

export const validateAugment = (
  augment: Augment | undefined,
  lineup: LineupSlot[],
): ValidationResult => {
  if (!augment) {
    return {
      isValid: false,
      qualifyingPlayers: [],
      unmetPrerequisites: ["No augment selected"],
      metPrerequisites: [],
    };
  }

  const activePlayers = lineup
    .filter((slot) => slot.player !== null)
    .map((slot) => slot.player!);

  const unmetPrerequisites: string[] = [];
  const metPrerequisites: string[] = [];
  let qualifyingPlayers: Player[] = [];

  for (const prerequisite of augment.prerequisites) {
    const result = evaluatePrerequisite(prerequisite, activePlayers);
    if (!result.isValid) {
      unmetPrerequisites.push(prerequisite.description);
    } else {
      metPrerequisites.push(prerequisite.description);
    }

    if (qualifyingPlayers.length === 0) {
      qualifyingPlayers = result.qualifyingPlayers;
    } else {
      qualifyingPlayers = qualifyingPlayers.filter((player) =>
        result.qualifyingPlayers.some((qp) => qp.id === player.id),
      );
    }
  }

  const hasEnoughPlayers = qualifyingPlayers.length >= augment.playerCount;
  const prerequisitesMet = unmetPrerequisites.length === 0;

  if (!hasEnoughPlayers && prerequisitesMet) {
    unmetPrerequisites.push(
      `Need ${augment.playerCount} qualifying players, but only have ${qualifyingPlayers.length}`,
    );
  }

  return {
    isValid: prerequisitesMet && hasEnoughPlayers,
    qualifyingPlayers,
    unmetPrerequisites,
    metPrerequisites,
  };
};

const evaluatePrerequisite = (
  prerequisite: Prerequisite,
  players: Player[],
): { isValid: boolean; qualifyingPlayers: Player[] } => {
  const { condition } = prerequisite;

  switch (prerequisite.type) {
    case "statThreshold":
      return evaluateStatThreshold(condition, players);
    case "positionRequirement":
      return evaluatePositionRequirement(condition, players);
    case "budgetThreshold":
      return evaluateBudgetThreshold(condition, players);

    // TODO:
    // case "teamRequirement":
    //   return evaluateTeamRequirement(condition, players);
    // case "playerCount":
    //   return evaluatePlayerCount(condition, players);
    default:
      return { isValid: false, qualifyingPlayers: [] };
  }
};

const evaluateStatThreshold = (
  condition: Condition,
  players: Player[],
): { isValid: boolean; qualifyingPlayers: Player[] } => {
  const { stat, operator, value, count } = condition;

  if (!stat || !operator || value === undefined) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const qualifyingPlayers = players.filter((player) =>
    meetStatCondition(player, stat, operator, value),
  );

  return {
    isValid: qualifyingPlayers.length >= count,
    qualifyingPlayers,
  };
};

const evaluatePositionRequirement = (
  condition: Condition,
  players: Player[],
): { isValid: boolean; qualifyingPlayers: Player[] } => {
  const { position, count } = condition;

  if (!position || position.length === 0) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const qualifyingPlayers = players.filter((player) =>
    player.positions.some((pos) => position.includes(pos as any)),
  );

  return {
    isValid: qualifyingPlayers.length >= count,
    qualifyingPlayers,
  };
};

const evaluateBudgetThreshold = (
  condition: Condition,
  players: Player[],
): { isValid: boolean; qualifyingPlayers: Player[] } => {
  const { operator, value } = condition;

  if (!operator || value === undefined) {
    return { isValid: false, qualifyingPlayers: [] };
  }

  const totalSalary = players.reduce((sum, player) => sum + player.salary, 0);
  const isValid = evaluateCondition(totalSalary, operator, value);

  return {
    isValid,
    qualifyingPlayers: isValid ? players : [],
  };
};

const meetStatCondition = (
  player: Player,
  stat: string,
  operator: string,
  value: number,
): boolean => {
  const playerStatValue = getStatValue(player.averageStats, stat);
  return evaluateCondition(playerStatValue, operator, value);
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
  stats: GameStats,
  playerId: string,
  qualifyingPlayers: Player[] | undefined,
  augment: Augment | undefined,
): number => {
  if (!augment || !augment.isActive || !qualifyingPlayers) {
    return baseFantasyPoints;
  }

  if (qualifyingPlayers.length < augment.playerCount) {
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
      const baseStatMultiplier = STAT_MULTIPLIERS[boost.stat] ?? 0;

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
      return stats.points;
    case "rebounds":
      return stats.rebounds;
    case "assists":
      return stats.assists;
    case "steals":
      return stats.steals;
    case "blocks":
      return stats.blocks;
    case "turnovers":
      return stats.turnovers;
    case "minutes":
      return stats.minutes;
    // TODO: Add support for FG%, FT%, 3P%, FGA, FGM, FTA, FTM, 3PA, 3PM
    default:
      return 0;
  }
};
