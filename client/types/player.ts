import { Position } from "./team";
import { NbaTeam } from "@/types/nbaTeams";

export type Player = {
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
  firstName: string;
  gamesPlayed: number;
  headshotUrl: string;
  height: string;
  id: string;
  jerseyNumber: string;
  playerId: string;
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

export const defaultPlayer: Player = {
  id: "",
  averageStats: {
    assists: 0,
    blocks: 0,
    fantasyPoints: 0,
    minutes: 0,
    points: 0,
    rebounds: 0,
    steals: 0,
    turnovers: 0,
  },
  firstName: "",
  gamesPlayed: 0,
  headshotUrl: "",
  height: "",
  jerseyNumber: "",
  playerId: "",
  positions: [],
  salary: 0,
  lastName: "",
  teamAbbreviation: "",
  teamId: "",
  weight: "",
};
