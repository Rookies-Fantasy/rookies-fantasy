export enum QueueStatus {
  Idle = "idle",
  Queued = "queued",
  Matched = "matched",
}

export type User = {
  avatarUrl?: string;
  dateOfBirth?: string;
  email?: string;
  emailVerified: boolean;
  id: string;
  username?: string;
  queueStatus: QueueStatus;
  queuedAt?: string;
  currentMatchupId?: string;
};

export const defaultUser: User = {
  id: "",
  emailVerified: false,
  queueStatus: QueueStatus.Idle,
};
