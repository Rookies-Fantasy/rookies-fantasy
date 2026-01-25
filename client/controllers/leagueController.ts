import firestore from "@react-native-firebase/firestore";
import { League } from "@/types/league";
import { Team } from "@/types/team";

const LEAGUE_COLLECTION = "leagues";

export type LeagueEditModel = {
  name: string;
  numberOfTeams: number;
  budget: number;
  initalTeamId?: string;
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
      };
    } catch (error) {
      console.error("Error fetching league:", error);
      throw error;
    }
  };

  static createLeague = async (
    userId: string,
    params: LeagueEditModel,
  ): Promise<League> => {
    try {
      // Create team for the user in their teams subcollection

      const leagueRef = await firestore()
        .collection(LEAGUE_COLLECTION)
        .add({
          name: params.name,
          creatorUserId: userId,
          numberOfTeams: params.numberOfTeams,
          budget: params.budget,
          memberCount: 1,
          teamIds: [params.initalTeamId],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      const leagueDoc = await leagueRef.get();
      const data = leagueDoc.data();

      return {
        budget: data?.budget,
        id: leagueDoc.id,
        name: data?.name,
        numberOfTeams: data?.numberOfTeams,
        memberCount: data?.memberCount,
        teamIds: data?.teamIds ?? [],
      };
    } catch (error) {
      console.error("Error creating league:", error);
      throw error;
    }
  };
}
