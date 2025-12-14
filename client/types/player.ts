import { Position } from "./team";
import { NbaTeam } from "@/types/nbaTeams";

export type Player = {
  averageStats: {
    ast: number;
    blk: number;
    fpts: number;
    min: number;
    pts: number;
    reb: number;
    stl: number;
    tov: number;
  };
  firstName: string;
  gamesPlayed: number;
  headshotUrl: string;
  height: string;
  id: string;
  jerseyNumber: string;
  positions: string[];
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
  averageStats: {
    ast: 0,
    blk: 0,
    fpts: 0,
    min: 0,
    pts: 0,
    reb: 0,
    stl: 0,
    tov: 0,
  },
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
