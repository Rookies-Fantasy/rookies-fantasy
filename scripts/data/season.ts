export type SeasonConfigDoc = {
  season: string;
  startDate: string;
  endDate: string;
};

export const DEFAULT_SEASON: SeasonConfigDoc = {
  season: "2026-27",
  startDate: "2026-10-20",
  endDate: "2027-04-11",
};
