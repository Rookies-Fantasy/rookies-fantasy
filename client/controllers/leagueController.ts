import firestore from "@react-native-firebase/firestore";
import { League } from "@/types/league";

const LEAGUE_COLLECTION = "leagues";

export type LeagueEditModel = {
  name: string;
  numberOfTeams: number;
  budget: number;
  initalTeamId?: string;
};

export class LeagueController {
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
