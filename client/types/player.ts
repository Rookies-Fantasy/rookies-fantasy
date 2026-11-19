import { Position } from "./team";
import { NbaTeam } from "@/types/nbaTeams";

export type PlayerAverageStats = {
  assists: number;
  blocks: number;
  fantasyPoints: number;
  minutes: number;
  points: number;
  rebounds: number;
  steals: number;
  turnovers: number;
};

// Some players have no averageStats in Firestore (e.g. no games played yet),
// so missing stats are treated as zeros.
export const defaultAverageStats: PlayerAverageStats = {
  assists: 0,
  blocks: 0,
  fantasyPoints: 0,
  minutes: 0,
  points: 0,
  rebounds: 0,
  steals: 0,
  turnovers: 0,
};

export type Player = {
  averageStats: PlayerAverageStats;
  firstName: string;
  gamesPlayed: number;
  headshotUrl: string;
  height: string;
  id: string;
  jerseyNumber: string;
  positions: Position[];
  salary: number;
  lastName: string;
  teamAbbreviation: string;
  teamId: string;
  weight: string;
};

export type PlayerFilters = {
  selectedTeams: NbaTeam[];
  selectedPositions: PositionFilters[];
  salaryRange: { min: number; max: number };
};

export type PositionFilters = Position | "ALL" | "G" | "F";
export const POSITION_FILTER_OPTIONS: PositionFilters[] = [
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "G",
  "F",
];

export const defaultPlayerFilters: PlayerFilters = {
  selectedTeams: [],
  selectedPositions: [],
  salaryRange: { min: 1000000, max: 150000000 },
};

export const defaultPlayer: Player = {
  id: "",
  averageStats: defaultAverageStats,
  firstName: "",
  gamesPlayed: 0,
  headshotUrl: "",
  height: "",
  jerseyNumber: "",
  positions: [],
  salary: 0,
  lastName: "",
  teamAbbreviation: "",
  teamId: "",
  weight: "",
};
