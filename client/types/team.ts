import { Augment } from "./augment";
import { Player } from "./player";

export const TEAM_BALANCE = 150000000;

export type GameInfo = {
  gameStatus: boolean;
  opponent: string;
  gameDate: string;
  isHome: boolean;
};

export type GameStats = {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fantasyPoints: number;
  minutes: number;
};

export type Team = {
  abbreviation?: string;
  augment?: Augment;
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
  gameInfo?: GameInfo;
  gameStats?: GameStats;
};

export type BenchSlot = {
  position: BenchPosition;
  player: Player;
};

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
