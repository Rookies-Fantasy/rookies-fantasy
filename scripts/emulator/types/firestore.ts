import type { Augment } from "../../../client/types/augment";
import type {
  LineupSnapshotItem,
  Matchup,
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

export type MatchupDoc = Matchup & {
  homeTeamSnapshot: TeamSnapshot;
  awayTeamSnapshot: TeamSnapshot;
  homeLineupSnapshots: Record<string, LineupSnapshotItem[]>;
  awayLineupSnapshots: Record<string, LineupSnapshotItem[]>;
};

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
