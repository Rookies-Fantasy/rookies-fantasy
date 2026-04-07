// Static NBA team data with real BallDontLie team IDs.
// Team IDs are sourced from the BallDontLie v1 API.
// The IDs listed here correspond to the teams used in data/nbaPlayers.ts.
// To add more teams, look up the team ID at https://api.balldontlie.io/v1/teams
// or run the existing scripts/fillNBATeams.js script pointing at the emulator.

import type { NbaTeamDoc } from "../types/firestore.js";

export const NBA_TEAMS: NbaTeamDoc[] = [
  {
    id: "6",
    abbreviation: "DAL",
    city: "Dallas",
    conference: "West",
    division: "Southwest",
    fullName: "Dallas Mavericks",
    name: "Mavericks",
    state: "Texas",
    logoUrl: "https://cdn.nba.com/logos/nba/1610612742/global/L/logo.svg",
  },
  {
    id: "13",
    abbreviation: "LAL",
    city: "Los Angeles",
    conference: "West",
    division: "Pacific",
    fullName: "Los Angeles Lakers",
    name: "Lakers",
    state: "California",
    logoUrl: "https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg",
  },
  {
    id: "14",
    abbreviation: "MIA",
    city: "Miami",
    conference: "East",
    division: "Southeast",
    fullName: "Miami Heat",
    name: "Heat",
    state: "Florida",
    logoUrl: "https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg",
  },
  {
    id: "15",
    abbreviation: "MIL",
    city: "Milwaukee",
    conference: "East",
    division: "Central",
    fullName: "Milwaukee Bucks",
    name: "Bucks",
    state: "Wisconsin",
    logoUrl: "https://cdn.nba.com/logos/nba/1610612749/global/L/logo.svg",
  },
  {
    id: "16",
    abbreviation: "MIN",
    city: "Minnesota",
    conference: "West",
    division: "Northwest",
    fullName: "Minnesota Timberwolves",
    name: "Timberwolves",
    state: "Minnesota",
    logoUrl: "https://cdn.nba.com/logos/nba/1610612750/global/L/logo.svg",
  },
];

export function getTeamByAbbr(abbr: string): NbaTeamDoc | undefined {
  return NBA_TEAMS.find((t) => t.abbreviation === abbr);
}

export function getTeamById(id: string): NbaTeamDoc | undefined {
  return NBA_TEAMS.find((t) => t.id === id);
}
