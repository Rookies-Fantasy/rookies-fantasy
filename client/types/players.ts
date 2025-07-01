export type Player = {
  id: string;
  firstName: string;
  secondName: string;
  height: string;
  weight: string;
  teamId: string;
  jerseyNumber: string;
  positions: string[];
  headshotUrl: string;
  teamAbbreviation: string;
  gamesPlayed: number;
  averageStats: {
    min: number;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
  };
};
