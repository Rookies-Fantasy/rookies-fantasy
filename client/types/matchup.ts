import { Augment } from "./augment";
import { Player } from "./players";
import { LineupSlot } from "./team";

export type MatchupTeam = {
  lineup: LineupSlot[];
  qualifyingPlayers?: Player[];
  score?: number;
};

export type DailyMatchup = {
  awayTeam: MatchupTeam;
  homeTeam: MatchupTeam;
};

export type Matchup = {
  id: string;
  awayAugment?: Augment;
  awayTeamId: string;
  awayTeamName: string;
  awayUserId: string;
  homeAugment?: Augment;
  homeTeamId: string;
  homeTeamName: string;
  homeUserId: string;
  status: "active" | "completed";
  weekStartDate: string;
  dailyMatchups: Record<string, DailyMatchup>;
};

export const defaultMatchup: Matchup = {
  id: "",
  awayTeamId: "",
  awayTeamName: "",
  awayUserId: "",
  homeTeamId: "",
  homeTeamName: "",
  homeUserId: "",
  status: "active",
  weekStartDate: "",
  dailyMatchups: {},
};
