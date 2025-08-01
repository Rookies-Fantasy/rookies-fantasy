import { Player } from "./players";

export type Team = {
  abbreviation?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
  lineup: Lineup;
};

type Position = "PG" | "SG" | "SF" | "PF" | "C";
type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";

type LineupSlot = {
  slot: Position | FlexPosition;
  player: Player | null;
}

type Lineup = {
  slots: LineupSlot[];
}

const SLOT_ORDER: (Position | FlexPosition)[] = [
  "PG", "SG", "SF", "PF", "C", "UTIL1", "UTIL2", "UTIL3"
];

export const defaultTeam: Team = {
  id: "",
  balance: 150000000,
  lineup: {
    slots: SLOT_ORDER.map((slot) => ({ slot, player: null }))
  }
};
