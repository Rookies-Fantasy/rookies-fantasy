import { Player } from "./players";

export type Team = {
  abbreviation?: string;
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
  balance: 150000000,
  lineup: SLOT_ORDER.map((position) => ({ position, player: null })),
};
