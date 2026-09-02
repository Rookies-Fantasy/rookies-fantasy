import firestore from "@react-native-firebase/firestore";
import { League } from "@/types/league";
import { Team } from "@/types/team";
import { callFunction } from "@/utils/callableUtils";

const LEAGUE_COLLECTION = "leagues";

const CREATE_SIGNED_OUT_ERROR = "You must be signed in to create a league";
const JOIN_SIGNED_OUT_ERROR = "You must be signed in to join a league";

export type LeagueEditModel = {
  name: string;
  numberOfTeams: number;
  budget: number;
  initialTeamId: string;
};

export type LeagueTeamInfo = {
  league: League;
  team: Team;
};

export class LeagueController {
  static getLeaguesByTeamIds = async (
    teamIds: string[],
  ): Promise<Map<string, League>> => {
    if (teamIds.length === 0) return new Map();

    try {
      const leagues = await firestore()
        .collection(LEAGUE_COLLECTION)
        .where("teamIds", "array-contains-any", teamIds)
        .get();

      const teamToLeague = new Map<string, League>();

      leagues.docs.forEach((doc) => {
        const data = doc.data();
        const league: League = {
          id: doc.id,
          name: data?.name,
          numberOfTeams: data?.numberOfTeams,
          budget: data?.budget,
          memberCount: data?.memberCount,
          teamIds: data?.teamIds ?? [],
          userIds: data.userIds ?? [],
        };

        (data?.teamIds ?? []).forEach((teamId: string) => {
          if (teamIds.includes(teamId)) {
            teamToLeague.set(teamId, league);
          }
        });
      });

      return teamToLeague;
    } catch (error) {
      console.error("Error fetching leagues by team IDs:", error);
      throw error;
    }
  };

  static getLeague = async (leagueId: string): Promise<League | null> => {
    try {
      const leagueDoc = await firestore()
        .collection(LEAGUE_COLLECTION)
        .doc(leagueId)
        .get();

      if (!leagueDoc.exists()) return null;

      const data = leagueDoc.data();
      return {
        id: leagueDoc.id,
        name: data?.name,
        numberOfTeams: data?.numberOfTeams,
        budget: data?.budget,
        memberCount: data?.memberCount,
        teamIds: data?.teamIds ?? [],
        userIds: data?.userIds ?? [],
      };
    } catch (error) {
      console.error("Error fetching league:", error);
      throw error;
    }
  };

  // Creates a league through the createLeague cloud function. `leagues/{id}` is
  // read-only to clients under Firestore rules — membership has to be written by
  // the server, otherwise any signed-in user could add themselves to any league
  // and read every member's private team data through getLeagueStandings.
  //
  // The creator's uid comes from the verified auth token, not from here, and the
  // team must already exist under users/{uid}/teams/{initialTeamId}.
  static createLeague = async (params: LeagueEditModel): Promise<League> => {
    try {
      const { league } = await callFunction<{ league: League }>(
        "createLeague",
        {
          name: params.name,
          numberOfTeams: params.numberOfTeams,
          budget: params.budget,
          initialTeamId: params.initialTeamId,
        },
        CREATE_SIGNED_OUT_ERROR,
      );

      return league;
    } catch (error) {
      console.error("Error creating league:", error);
      throw error;
    }
  };

  // Joins a league through the joinLeague cloud function, which enforces the
  // membership preconditions (league exists, team/user not already joined, league
  // not full) inside a transaction. There is no userId parameter by design: the
  // joining user is taken from the verified auth token.
  //
  // Returns the league as it stands after the join, so callers can update Redux
  // without a follow-up read.
  static joinLeague = async (
    leagueId: string,
    teamId: string,
  ): Promise<League> => {
    try {
      const { league } = await callFunction<{ league: League }>(
        "joinLeague",
        { leagueId, teamId },
        JOIN_SIGNED_OUT_ERROR,
      );

      return league;
    } catch (error) {
      console.error("Join league error:", error);
      throw error;
    }
  };
}
