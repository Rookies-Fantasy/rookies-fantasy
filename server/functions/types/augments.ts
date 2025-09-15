export type Augment = {
  title: string;
  description: string;
  iconUrl: string;
  info: string;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
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
  teamId?: String;
};

export type Prerequisite = {
  condition: Condition;
  type:
    | "statThreshold"
    | "positionRequirement"
    | "teamRequirement"
    | "budgetThreshold"
    | "playerCount";
  description: String;
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
      multiplier: Number;
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
