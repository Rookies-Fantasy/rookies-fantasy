import { Position } from "./team";

export type Augment = {
  description: string;
  iconUrl: string;
  id: string;
  info: string;
  title: string;
  isActive: boolean;
  updatedAt?: string;
  createdAt?: string;
  prerequisites: Prerequisite[];
  effects: Effect[];
};

type Stat =
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

type PrerequisiteType =
  | "statThreshold"
  | "positionRequirement"
  | "teamRequirement"
  | "budgetThreshold"
  | "playerCount";

export type Condition = {
  count: number;
  stat?: Stat;
  operator?: ">=" | ">" | "<=" | "<" | "=";
  value?: number;
  position?: Position[];
  teamId?: string;
};

export type Prerequisite = {
  condition: Condition;
  type: PrerequisiteType;
  description: string;
};

export type Effect = {
  statBoosts: [
    {
      stat: Stat;
      multiplier: number;
    },
  ];
};

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
