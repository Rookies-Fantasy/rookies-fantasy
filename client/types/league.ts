export type League = {
  id: string;
  name: string;
  numberOfTeams: number;
  budget: number;
  memberCount: number;
  teamIds: string[];
  createdAt?: string;
  updatedAt?: string;
};
