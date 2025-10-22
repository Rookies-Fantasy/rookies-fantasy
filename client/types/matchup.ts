import { Player } from "./players";
import { LineupSlot } from "./team";

export type MatchupTeam = {
  id: string;
  lineup: LineupSlot[];
  metadata?: Record<string, any>;
  qualifyingPlayers?: Player[];
  score?: number;
};

export type DailyMatchup = {
  awayTeam: MatchupTeam;
  homeTeam: MatchupTeam;
};

export type Matchup = {
  id: string;
  awayUserId: string;
  homeUserId: string;
  status: "active" | "completed";
  weekStartDate: string;
  dailyMatchups: Record<string, DailyMatchup>;
};

export const defaultMatchup: Matchup = {
  id: "",
  awayUserId: "",
  homeUserId: "",
  status: "active",
  weekStartDate: "",
  dailyMatchups: {},
};
