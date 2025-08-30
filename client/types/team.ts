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
  bench: BenchSlot[];
  hasUserChanges?: boolean;
};

export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";
export type BenchPosition = `BEN${number}`;
export type SlotPosition = Position | FlexPosition | BenchPosition;

export type LineupSlot = {
  position: SlotPosition;
  player: Player | null;
};

export type BenchSlot = {
  position: BenchPosition;
  player: Player | null;
};

export const POSITIONS = ["PG", "SG", "SF", "PF", "C"];
export const UTIL_POSITIONS: FlexPosition[] = ["UTIL1", "UTIL2", "UTIL3"];

export const SLOT_ORDER: SlotPosition[] = [
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  ...UTIL_POSITIONS,
];

export const defaultTeam: Team = {
  id: "",
  balance: TEAM_BALANCE,
  lineup: SLOT_ORDER.map((position) => ({ position, player: null })),
  bench: [],
  hasUserChanges: false,
};
