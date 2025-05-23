export type User = {
  avatarUrl?: string;
  dateOfBirth?: string;
  email?: string;
  id: string;
  name?: string;
  username?: string;
};

export const defaultUser: User = { id: "" };
