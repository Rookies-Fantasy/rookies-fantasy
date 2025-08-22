export const TEAM_BALANCE = 150000000;

export type Team = {
  abbreviation?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
};

export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";
export type BenchPosition = `BEN${number}`;
export type SlotPosition = Position | FlexPosition | BenchPosition;

export const defaultTeam: Team = {
  id: "",
  balance: TEAM_BALANCE,
};
