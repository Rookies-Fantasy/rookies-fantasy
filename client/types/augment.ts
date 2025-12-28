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
  playerCount: number;
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
