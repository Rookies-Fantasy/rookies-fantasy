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
  playerId: string;
  positions: string[];
  salary: number;
  secondName: string;
  teamAbbreviation: string;
  teamId: string;
  weight: string;
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
  playerId: "",
  positions: [],
  salary: 0,
  secondName: "",
  teamAbbreviation: "",
  teamId: "",
  weight: "",
};
