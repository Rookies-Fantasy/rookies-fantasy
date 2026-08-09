export type AugmentPrerequisite = {
  type: string;
  condition: {
    count?: number;
    stat?: string;
    operator?: ">" | "<" | ">=" | "<=";
    value?: number;
    position?: string[];
  };
  description: string;
};

export type AugmentEffect = {
  target: string;
  statBoosts: {
    stat: string;
    multiplier: number;
  }[];
};

export type Augment = {
  title: string;
  description: string;
  iconUrl: string;
  info: string;
  prerequisites: AugmentPrerequisite[];
  effects: AugmentEffect[];
  isActive: boolean;
  playerCount?: number;
  createdAt: Date;
  updatedAt: Date;
};
