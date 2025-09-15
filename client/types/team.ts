import { Player } from "./players";
export const TEAM_BALANCE = 150000000;

export type Team = {
  abbreviation?: string;
  augmentId?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
  lineup: LineupSlot[];
};

export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";
export type SlotPosition = Position | FlexPosition;

export type LineupSlot = {
  position: SlotPosition;
  player: Player | null;
};

export const SLOT_ORDER: SlotPosition[] = [
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "UTIL1",
  "UTIL2",
  "UTIL3",
];

export const defaultTeam: Team = {
  id: "",
  balance: TEAM_BALANCE,
  lineup: SLOT_ORDER.map((position) => ({ position, player: null })),
};
