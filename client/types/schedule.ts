export type Countdown = {
  hours: number;
  minutes: number;
};

export type ScheduleState =
  | { status: "loading" }
  | { status: "scheduled"; startTime: string }
  | { status: "no-games" }
  | { status: "error" };

export type LineupLockState =
  | { status: "loading" }
  | { status: "scheduled"; countdown: Countdown }
  | { status: "locked" }
  | { status: "no-games" }
  | { status: "error" };
