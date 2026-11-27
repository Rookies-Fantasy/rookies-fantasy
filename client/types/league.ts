export type League = {
  id: string;
  name: string;
  creatorUserId: string;
  numberOfTeams: number;
  budget: number;
  memberCount: number;
  teamIds: string[];
  userIds: string[];
  createdAt?: string;
  updatedAt?: string;
};
