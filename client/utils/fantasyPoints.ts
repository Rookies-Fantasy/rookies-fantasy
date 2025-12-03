import { GameStats } from "@/types/team";

export const calculateFantasyPoints = (stats: GameStats): number => {
  const { pts, reb, ast, stl, blk, tov } = stats;

  const fantasyPoints =
    pts * 1 + reb * 1 + ast * 2 + stl * 3 + blk * 3 + tov * -2;

  return fantasyPoints;
};
