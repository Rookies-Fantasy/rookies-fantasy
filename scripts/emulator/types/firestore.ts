import type { Augment } from "../../../client/types/augment";
import type { League } from "../../../client/types/league";
import type {
  LeagueMatchup,
  LineupSnapshotItem,
  RankedMatchup,
  TeamSnapshot,
} from "../../../client/types/matchup";
import type {
  PlayerTeamDisplay,
  Team,
  TeamLineupSlot,
} from "../../../client/types/team";

export type UserDoc = {
  id: string;
  email: string;
  emailVerified: boolean;
  avatarUrl?: string;
  dateOfBirth?: Date;
  username?: string;
  queueStatus: "idle" | "queued" | "matched";
  teamId?: string;
  currentMatchupId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamDoc = Team & {
  createdAt: Date;
  updatedAt: Date;
  matchupId?: string;
  augment?: Augment;
};

export type LeagueDoc = Omit<League, "id" | "createdAt" | "updatedAt"> & {
  creatorUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type MatchupDocFields = {
  createdAt: Date;
  homeTeamSnapshot: TeamSnapshot;
  awayTeamSnapshot: TeamSnapshot;
  homeLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  awayLineupSnapshots: Record<string, LineupSnapshotItem[]>;
};

export type RankedMatchupDoc = Omit<RankedMatchup, "createdAt"> &
  MatchupDocFields;

export type LeagueMatchupDoc = Omit<LeagueMatchup, "createdAt"> &
  MatchupDocFields;

export type MatchupDoc = RankedMatchupDoc | LeagueMatchupDoc;

export type PlayerDoc = PlayerTeamDisplay & {
  gamesPlayed: number;
  averageStats: {
    assists: number;
    blocks: number;
    fantasyPoints: number;
    minutes: number;
    points: number;
    rebounds: number;
    steals: number;
    turnovers: number;
  };
  height: string;
  jerseyNumber: string;
  teamId: string;
};

export type TeamLineupDoc = TeamLineupSlot;
