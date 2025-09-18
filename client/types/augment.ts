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

export type Condition = {
  count: number;
  stat?:
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
  operator?: ">=" | ">" | "<=" | "<" | "=";
  value?: number;
  position?: ("PG" | "SG" | "SF" | "PF" | "C")[];
  teamId?: string;
};

export type Prerequisite = {
  condition: Condition;
  type:
    | "statThreshold"
    | "positionRequirement"
    | "teamRequirement"
    | "budgetThreshold"
    | "playerCount";
  description: string;
};

export type Effect = {
  target: "qualifying" | "all";
  statBoosts: [
    {
      stat:
        | "points"
        | "rebounds"
        | "assists"
        | "steals"
        | "blocks"
        | "threePointers"
        | "fieldGoalPercentage"
        | "freeThrowPercentage"
        | "turnovers";
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
