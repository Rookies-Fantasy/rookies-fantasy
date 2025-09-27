export type Queue = {
  teamId: string;
  queuedAt: string;
  status: "waiting" | "matched";
};
