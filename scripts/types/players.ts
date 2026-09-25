export type PlayerGameLog = {
  gameId: number;
  date: string;
  teamId: number;
  homeTeamId: number;
  visitorTeamId: number;

  minutes: string; // BDL API provides this as a string
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personalFouls: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointerPercentage: number;
  fantasyPoints: number;
};

export type PlayerAverageStats = {
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  fieldGoalPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  threePointersMade: number;
  threePointersAttempted: number;
  threePointerPercentage: number;
  fantasyPoints: number;
};

export type NBAPlayer = {
  playerId: string;
  teamId: string;
  firstName: string;
  lastName: string;
  firstNameLower: string;
  lastNameLower: string;
  fullNameLower: string;
  positions: string[];
  height: string;
  weight: string;
  jerseyNumber: string;
  country: string;
  headshotURL: string;
  gamesPlayed: number;
  averageStats: PlayerAverageStats;
  salary: number;
  gamelog: PlayerGameLog[];
  teamAbbreviation: string;
};
