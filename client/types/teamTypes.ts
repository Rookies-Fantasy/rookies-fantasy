export const TEAM_BALANCE = 150000000;

export type Team = {
  abbreviation?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
};

export const defaultTeam: Team = {
  id: "",
  balance: TEAM_BALANCE,
};
