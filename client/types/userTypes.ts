export type User = {
  avatarUrl?: string;
  dateOfBirth?: string;
  email?: string;
  emailVerified: boolean;
  id: string;
  username?: string;
};

export const defaultUser: User = { id: "", emailVerified: false };
