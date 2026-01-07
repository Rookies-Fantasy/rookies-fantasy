export type LeagueConfig = {
  minTeams: number;
  maxTeams: number;
  budget: number;
  // TODO: Add scoring types?
};

export type LeagueMember = {
  userId: string;
  username: string;
  leagueTeamId: string;
  joinedAt: string;
};

export type League = {
  id: string;
  name: string;
  description?: string;
  creatorUserId: string;
  status: "open" | "closed" | "active" | "completed";
  config: LeagueConfig;
  memberCount: number;
  seasonStartDate: string;
  createdAt?: string;
  updatedAt?: string;
};
