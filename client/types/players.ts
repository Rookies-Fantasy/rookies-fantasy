import { PositionFilters } from "./team";
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
