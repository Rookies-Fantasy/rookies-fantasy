import { Prerequisite, Effect, Player, Condition } from "../../types/augments";

export function validatePrerequisite(
  prerequisite: Prerequisite,
  players: Player[],
) {
  const { type, condition } = prerequisite;

  switch (type) {
    case "statThreshold":
      return validateStatThreshold(condition, players);
    case "positionRequirement":
      return validatePositionRequirement(condition, players);
    case "budgetThreshold":
      return validateBudgetThreshold(condition, players);
    // case "teamRequirement":
    //   return validateTeamRequirement(condition, players);
    // case "playerCount":
    //   return validatePlayerCount(condition, players);
    default:
      return { isValid: false, qualifyingPlayers: [] };
  }
}

function validateStatThreshold(condition: Condition, players: Player[]) {
  const { stat, operator, value, count } = condition;

  const statMap: Record<string, keyof Player["averageStats"]> = {
    points: "pts",
    rebounds: "reb",
    assists: "ast",
    steals: "stl",
    blocks: "blk",
    turnovers: "tov",
    minutes: "min",
  };

  const qualifiedPlayers = players.filter((player) => {
    if (stat && operator && value) {
      const statField = statMap[stat] || stat;
      const statValue = player.averageStats[statField] || 0;
      return evaluateCondition(statValue, operator, value);
    }
    return false;
  });

  return qualifiedPlayers.length >= count;
}

function validatePositionRequirement(condition: Condition, players: Player[]) {
  const { position, count } = condition;

  const positionPlayers = players
    .filter((player) => position?.some((pos) => player.positions.includes(pos)))
    .slice(0, count);

  return positionPlayers.length >= count;
}

// TODO: VALIDATE PLAYER COUNT

// TODO: VALIDATE TEAM REQUIREMENT

function validateBudgetThreshold(condition: Condition, players: Player[]) {
  const { value, count } = condition;

  const budgetPlayers = players
    .filter((player) => {
      if (value) player.salary <= value;
    })
    .slice(0, count);

  return budgetPlayers.length >= count;
}

function evaluateCondition(value: number, operator: string, threshold: number) {
  switch (operator) {
    case ">=":
      return value >= threshold;
    case ">":
      return value > threshold;
    case "<=":
      return value <= threshold;
    case "<":
      return value < threshold;
    case "=":
      return value === threshold;
    default:
      return false;
  }
}
