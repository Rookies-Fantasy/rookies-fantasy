export type Team = {
  abbreviation?: string;
  id: string;
  logoUrl?: string;
  name?: string;
  balance: number;
};

export const defaultTeam: Team = {
  id: "",
  balance: 100000000,
};
