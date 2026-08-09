import { BalldontlieAPI } from "@balldontlie/sdk";
import { Firestore } from "firebase-admin/firestore";
import { BaseMigration } from "./BaseMigration.js";
import type { NBATeam } from "../types/teams.js";

/**
 * Team state mapping (city -> state)
 */
const TEAM_STATES: Record<string, string> = {
  "Atlanta": "Georgia",
  "Boston": "Massachusetts",
  "Brooklyn": "New York",
  "Charlotte": "North Carolina",
  "Chicago": "Illinois",
  "Cleveland": "Ohio",
  "Dallas": "Texas",
  "Denver": "Colorado",
  "Detroit": "Michigan",
  "Golden State": "California",
  "Houston": "Texas",
  "Indianapolis": "Indiana",
  "Los Angeles": "California",
  "Memphis": "Tennessee",
  "Miami": "Florida",
  "Milwaukee": "Wisconsin",
  "Minneapolis": "Minnesota",
  "New Orleans": "Louisiana",
  "New York": "New York",
  "Oklahoma City": "Oklahoma",
  "Orlando": "Florida",
  "Philadelphia": "Pennsylvania",
  "Phoenix": "Arizona",
  "Portland": "Oregon",
  "Sacramento": "California",
  "San Antonio": "Texas",
  "San Francisco": "California",
  "Toronto": "Ontario",
  "Salt Lake City": "Utah",
  "Washington": "District of Columbia",
};

/**
 * NBA Teams Migration
 * Fetches team data from Ball Don't Lie API and logo URLs from NBA CDN
 */
export class NBATeamsMigration extends BaseMigration<NBATeam> {
  private api: BalldontlieAPI;

  constructor(db: Firestore, apiKey: string) {
    super(db, "nbaTeams");
    this.api = new BalldontlieAPI({ apiKey });
  }

  /**
   * Get state for a team based on city
   */
  private getTeamState(city: string): string {
    return TEAM_STATES[city] || "";
  }

  /**
   * Generate NBA CDN logo URL for a team
   * NBA CDN format: https://cdn.nba.com/logos/nba/{teamId}/global/L/logo.svg
   * Alternative: https://cdn.nba.com/logos/nba/{teamId}/primary/L/logo.svg
   */
  private getTeamLogoUrl(teamId: string): string {
    // The Ball Don't Lie team ID can be used directly
    // NBA uses team abbreviations in their CDN
    // We'll use the format: https://cdn.nba.com/logos/nba/{teamId}/global/L/logo.svg
    return `https://cdn.nba.com/logos/nba/${teamId}/global/L/logo.svg`;
  }

  /**
   * Fetch all teams from Ball Don't Lie API
   */
  async fetchData(): Promise<any[]> {
    console.log("   → Fetching NBA teams...");
    const response = await this.api.nba.getTeams();

    if (!response.data) {
      throw new Error("No teams data received from API");
    }

    // Filter out teams without a division (inactive teams)
    const activeTeams = response.data.filter(
      (team: any) => team.division && team.division.trim() !== ""
    );

    console.log(`   ✓ Found ${activeTeams.length} active teams`);
    return activeTeams;
  }

  /**
   * Transform raw team data into NBATeam format
   */
  transform(rawTeam: any): NBATeam {
    const state = this.getTeamState(rawTeam.city);
    const logoUrl = this.getTeamLogoUrl(rawTeam.id.toString());

    return {
      id: rawTeam.id.toString(),
      name: rawTeam.name,
      fullName: rawTeam.full_name,
      abbreviation: rawTeam.abbreviation,
      city: rawTeam.city,
      state,
      conference: rawTeam.conference,
      division: rawTeam.division,
      logoUrl,
    };
  }

  /**
   * Validate team data
   */
  validate(team: NBATeam): boolean {
    return !!(
      team.id &&
      team.name &&
      team.fullName &&
      team.abbreviation &&
      team.city &&
      team.conference &&
      team.division
    );
  }
}
