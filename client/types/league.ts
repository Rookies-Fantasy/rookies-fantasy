export type LeagueMember = {
  userId: string;
  leagueTeamId: string;
  joinedAt: string;
};

export type League = {
  id: string;
  name: string;
  numberOfTeams: number;
  budget: number;
  memberCount: number;
  createdAt?: string;
  updatedAt?: string;
};
