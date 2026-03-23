import { Augment } from "./augment";
import { Player } from "./player";
import { GameInfo, GameStats, LineupSlot, TeamRecord } from "./team";

// export type MatchupTeam = {
//   lineup: LineupSlot[];
//   qualifyingPlayers?: Player[];
//   score?: number;
// };

// export type DailyMatchup = {
//   awayTeam: MatchupTeam;
//   homeTeam: MatchupTeam;
// };

type TeamInfo = {
  id: string;
  name: string;
  logoUrl: string;
  record: TeamRecord;
  augment: Augment;
};

type MatchupPlayer = {
  firstName: string;
  lastName: string;
  gameStats: GameStats;
  gameInfo: GameInfo;
  playerId: string;
};

type Position = "PG" | "SG" | "SF" | "PF" | "C" | "UTIL1" | "UTIL2" | "UTIL3";

type LineupSnapshot = {
  [P in Position]: MatchupPlayer;
};

type TeamLineup = {
  [P in Position]?: string;
};

export type Matchup = {
  id: string;
  weekStartDate: string;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  lineupSnapshots: Record<string, LineupSnapshot>;
};

// export type Matchup2 = {
//   id: string;
//   away: {
//     awayAugment?: Augment;
//     awayTeamId: string;
//     awayTeamLogo?: string;
//     awayTeamName: string;
//     awayUserId: string;
//     awayWeeklyAcquisitionsUsed: number;
//   };
//   home: {
//     homeAugment?: Augment;
//     homeTeamId: string;
//     homeTeamLogo?: string;
//     homeTeamName: string;
//     homeUserId: string;
//     homeWeeklyAcquisitionsUsed: number;
//   };
//   status: "active" | "completed";
//   weekStartDate: string;
//   dailyMatchups: Record<string, DailyMatchup>;
// };
