// Firestore document types for the emulator seeder.
// These mirror the production Firestore schema — do NOT import from client/types/.
// Field names match what the server actually writes (e.g. headshotURL, jerseyNumber: string).

// ─── Shared primitives ────────────────────────────────────────────────────────

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

// ─── Augments ────────────────────────────────────────────────────────────────

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

// ─── NBA Teams ────────────────────────────────────────────────────────────────

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

// ─── NBA Players ─────────────────────────────────────────────────────────────

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

// GamelogEntry: stored inside NbaPlayerDoc.gamelog[].
// Note: freeThrowPerfectange is a typo preserved from the production schema.
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
  freeThrowPerfectange: number;
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

// ─── Teams ────────────────────────────────────────────────────────────────────

// Embedded player shape within a lineup slot (differs from NbaPlayerDoc).
// Uses camelCase `headshotUrl` to match client/types/player.ts Player type.
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

// ─── Users ────────────────────────────────────────────────────────────────────

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

// ─── Matchups ─────────────────────────────────────────────────────────────────

// Both home and away use prefixed field names since they're stored as one flat
// object each (matches what weeklyMatchupReset reads).
// `augment` is aliased alongside homeAugment/awayAugment since updateDailyPlayerData
// reads matchupData.home?.augment and matchupData.away?.augment.
export type MatchupHome = {
  homeTeamId: string;
  homeUserId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  homeAugment: AugmentDoc | null;
  augment: AugmentDoc | null;
  homeWeeklyAcquisitionsUsed: number;
  record: TeamRecord;
};

export type MatchupAway = {
  awayTeamId: string;
  awayUserId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  awayAugment: AugmentDoc | null;
  augment: AugmentDoc | null;
  awayWeeklyAcquisitionsUsed: number;
  record: TeamRecord;
};

export type MatchupDoc = {
  id: string;
  createdAt: Date;
  // weekStartDate: written by processQueue
  // weekStart: queried by updateDailyPlayerData — both are set to the same value
  weekStartDate: string;
  weekStart: string;
  homeTeamId: string;
  awayTeamId: string;
  homeUserId: string;
  awayUserId: string;
  status: "active" | "completed";
  home: MatchupHome;
  away: MatchupAway;
  lineupSnapshots: Record<string, LineupSnapshot>;
  winner?: string;
  completedAt?: Date;
};

// lineupSnapshots keyed by date string "YYYY-MM-DD"
export type LineupSnapshot = {
  homeSnapshot: LineupSnapshotEntry[];
  awaySnapshot: LineupSnapshotEntry[];
};

export type LineupSnapshotEntry = {
  position: SlotPosition;
  player: LineupPlayer | null;
  gameStats?: GameStats;
};
