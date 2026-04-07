export type Position = "PG" | "SG" | "SF" | "PF" | "C";
export type FlexPosition = "UTIL1" | "UTIL2" | "UTIL3";
export type BenchPosition = "BEN1" | "BEN2" | "BEN3";
export type SlotPosition = Position | FlexPosition | BenchPosition;

export const SLOT_ORDER: SlotPosition[] = [
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "UTIL1",
  "UTIL2",
  "UTIL3",
];

export type TeamRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type GameInfo = {
  gameStatus: boolean;
  opponent: string;
  gameDate: string;
  isHome: boolean;
};

export type GameStats = {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fantasyPoints: number;
  minutes: number;
};

export type Stat =
  | "points"
  | "rebounds"
  | "assists"
  | "steals"
  | "blocks"
  | "threePointers"
  | "fieldGoalPercentage"
  | "freeThrowPercentage"
  | "turnovers"
  | "minutes"
  | "threePointerPercentage"
  | "threePointersAttempted";

export type Condition = {
  count: number;
  stat?: Stat;
  operator?: ">=" | ">" | "<=" | "<" | "=";
  value?: number;
  position?: Position[];
  teamId?: string;
};

export type Prerequisite = {
  type:
    | "statThreshold"
    | "positionRequirement"
    | "teamRequirement"
    | "budgetThreshold"
    | "playerCount";
  condition: Condition;
  description: string;
};

export type Effect = {
  target: "qualifying";
  statBoosts: [{ stat: Stat; multiplier: number }];
};

export type AugmentDoc = {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  info: string;
  isActive: boolean;
  playerCount: number;
  prerequisites: Prerequisite[];
  effects: Effect[];
  createdAt: Date;
  updatedAt: Date;
};

export type NbaTeamDoc = {
  id: string;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  fullName: string;
  name: string;
  state: string;
  logoUrl: string;
};

export type AverageStats = {
  assists: number;
  blocks: number;
  fantasyPoints?: number;
  fieldGoalPercentage: number;
  fieldGoalsAttempted: number;
  fieldGoalsMade: number;
  freeThrowPercentage: number;
  freeThrowsAttempted: number;
  freeThrowsMade: number;
  minutes: number;
  personalFouls: number;
  points: number;
  rebounds: number;
  steals: number;
  threePointerPercentage: number;
  threePointersAttempted: number;
  threePointersMade: number;
  turnovers: number;
};

export type GamelogEntry = {
  date: string;
  gameId: number;
  homeTeamId: number;
  visitorTeamId: number;
  teamId: number;
  assists: number;
  blocks: number;
  fantasyPoints: number;
  fieldGoalPercentage: number;
  fieldGoalsAttempted: number;
  fieldGoalsMade: number;
  freeThrowPercentage: number;
  freeThrowsAttempted: number;
  freeThrowsMade: number;
  minutes: number;
  personalFouls: number;
  points: number;
  rebounds: number;
  steals: number;
  threePointerPercentage: number;
  threePointersAttempted: number;
  threePointersMade: number;
  turnovers: number;
};

export type NbaPlayerDoc = {
  playerId: string;
  teamId: string;
  firstName: string;
  firstNameLower: string;
  lastName: string;
  lastNameLower: string;
  fullNameLower: string;
  positions: Position[];
  height: string;
  weight: string;
  jerseyNumber: string;
  country: string;
  headshotURL: string;
  salary: number;
  gamesPlayed: number;
  averageStats: AverageStats;
  gamelog: GamelogEntry[];
};

export type LineupPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  positions: Position[];
  teamId: string;
  teamAbbreviation: string;
  headshotUrl: string;
  height: string;
  weight: string;
  jerseyNumber: string;
  salary: number;
  gamesPlayed: number;
  averageStats: AverageStats;
  gamelog: GamelogEntry[];
};

export type LineupSlot = {
  position: SlotPosition;
  player: LineupPlayer | null;
  gameInfo?: GameInfo;
  gameStats?: GameStats;
};

export type BenchSlot = {
  position: BenchPosition;
  player: LineupPlayer;
};

export type TeamDoc = {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl: string;
  balance: number;
  lineup: LineupSlot[];
  bench: BenchSlot[];
  augment?: AugmentDoc;
  record: TeamRecord;
  weeklyAcquisitionsUsed: number;
  matchupId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamSnapshot = {
  name: string;
  logoUrl: string;
  record: TeamRecord;
  augment: AugmentDoc | null;
};

export type QueueStatus = "idle" | "queued" | "matched";

export type UserDoc = {
  id: string;
  email: string;
  emailVerified: boolean;
  queueStatus: QueueStatus;
  username?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  teamId?: string;
  queuedAt?: Date;
  currentMatchupId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MatchupDoc = {
  id: string;
  createdAt: Date;
  // TODO: weekStart has been removed in favour of weekStartDate.
  // Audit and update all functions that read weekStart to use weekStartDate instead.
  weekStartDate: string;
  homeTeamId: string;
  awayTeamId: string;
  homeUserId: string;
  awayUserId: string;
  status: "active" | "completed";
  winnerId?: string;

  homeTeamSnapshot: TeamSnapshot;
  awayTeamSnapshot: TeamSnapshot;
  homeLineupSnapshot: Record<string, LineupSnapshotEntry>;
  awayLineupSnapshot: Record<string, LineupSnapshotEntry>;

  completedAt?: Date;
};

export type LineupSnapshotEntry = {
  position: SlotPosition;
  player: LineupPlayer | null;
  gameStats?: GameStats;
};
