import { GameStats } from "@/types/matchup";

export const calculateFantasyPoints = (stats: GameStats): number => {
  const { points, rebounds, assists, steals, blocks, turnovers } = stats;

  const fantasyPoints =
    points * 1 +
    rebounds * 1 +
    assists * 2 +
    steals * 3 +
    blocks * 3 +
    turnovers * -2;

  return fantasyPoints;
};
