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
  away: {
    awayAugment?: Augment;
    awayTeamId: string;
    awayTeamLogo?: string;
    awayTeamName: string;
    awayUserId: string;
    awayWeeklyAcquisitionsUsed: number;
  };
  home: {
    awayWeeklyAquisitionsUsed: number;
    homeAugment?: Augment;
    homeTeamId: string;
    homeTeamLogo?: string;
    homeTeamName: string;
    homeUserId: string;
    homeWeeklyAcquisitionsUsed: number;
  };
  homeWeeklyAquisitionsUsed: number;
  status: "active" | "completed";
  weekStartDate: string;
  dailyMatchups: Record<string, DailyMatchup>;
};

export const defaultMatchup: Matchup = {
  id: "",
  away: {
    awayTeamId: "",
    awayTeamName: "",
    awayUserId: "",
    awayWeeklyAquisitionsUsed: 0,
    awayWeeklyAcquisitionsUsed: 4,
  },
  home: {
    homeTeamId: "",
    homeTeamName: "",
    homeUserId: "",
    homeWeeklyAquisitionsUsed: 0,
    homeWeeklyAcquisitionsUsed: 4,
  },
  status: "active",
  weekStartDate: "",
  dailyMatchups: {},
};
