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
  awayTeamLogo?: string;
  awayTeamName: string;
  awayUserId: string;
  awayWeeklyAquisitionsUsed: number;
  homeAugment?: Augment;
  homeTeamId: string;
  homeTeamLogo?: string;
  homeTeamName: string;
  homeUserId: string;
  homeWeeklyAquisitionsUsed: number;
  status: "active" | "completed";
  weekStartDate: string;
  dailyMatchups: Record<string, DailyMatchup>;
};

export const defaultMatchup: Matchup = {
  id: "",
  awayTeamId: "",
  awayTeamName: "",
  awayUserId: "",
  awayWeeklyAquisitionsUsed: 0,
  homeTeamId: "",
  homeTeamName: "",
  homeUserId: "",
  homeWeeklyAquisitionsUsed: 0,
  status: "active",
  weekStartDate: "",
  dailyMatchups: {},
};
