import { Augment } from "./augment";
import { Player } from "./player";
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
    homeAugment?: Augment;
    homeTeamId: string;
    homeTeamLogo?: string;
    homeTeamName: string;
    homeUserId: string;
    homeWeeklyAcquisitionsUsed: number;
  };
  status: "active" | "completed";
  weekStartDate: string;
  dailyMatchups: Record<string, DailyMatchup>;
};
