import { Augment } from "./augment";
// Type-only import: erased at build, so it introduces no runtime cycle even
// though player.ts imports Position from this file.
import type { Player } from "./player";

export const TEAM_BALANCE = 150000000;

export type TeamRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type PlayerTeamDisplay = {
  firstName: string;
  lastName: string;
  headshotUrl: string;
  positions: SlotPosition[];
  salary: number;
  id: string;
  teamAbbreviation: string;
  // Lineup players must carry season averages: augment validation reads
  // player.averageStats (see utils/augmentUtils.ts). Reuse Player's shape so
  // the two can't drift. Required so any construction site that omits it fails
  // to compile instead of crashing at runtime.
  averageStats: Player["averageStats"];
};

export type TeamLineupSlot = {
  position: SlotPosition;
  player: PlayerTeamDisplay | null;
};

export type BenchSlot = {
  position: BenchPosition;
  player: PlayerTeamDisplay;
};

export type Team = {
  abbreviation?: string;
  augment?: Augment;
  augmentId?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
  lineup: TeamLineupSlot[];
  record?: TeamRecord;
  hasUserChanges?: boolean;
  bench: BenchSlot[];
  isLeagueTeam?: boolean;
};

export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";
export type BenchPosition = `BEN${number}`;
export type SlotPosition = Position | FlexPosition | BenchPosition;

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
  record: {
    wins: 0,
    losses: 0,
    draws: 0,
  },
};
