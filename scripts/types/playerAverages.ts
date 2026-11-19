type PlayerAverages = {
  id: string;
  playerId: string;
  seasonId: string;
  gamesPlayed: number;
  averageStats: {
    minutes: number;
    fieldGoalsMade: number;
    fieldGoalsAttempted: number;
    fieldGoalPercentage: number;
    freeThrowsAttempted: number;
    freeThrowsMade: number;
    freeThrowPerfectange: number;
    threePointersAttempted: number;
    threePointersMade: number;
    threePointerPercentage: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    personalFouls: number;
    points: number;
  };
};
