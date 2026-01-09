import firestore from "@react-native-firebase/firestore";
import { League } from "@/types/league";

const LEAGUE_COLLECTION = "leagues";
const LEAGUE_MEMBERS_COLLECTION = "members";

export type CreateLeagueParams = {
  name: string;
  numberOfTeams: number;
  budget: number;
};

export class LeagueController {
  static createLeague = async (
    userId: string,
    params: CreateLeagueParams,
  ): Promise<League> => {
    try {
      const leagueRef = await firestore().collection(LEAGUE_COLLECTION).add({
        name: params.name,
        creatorUserId: userId,
        numberOfTeams: params.numberOfTeams,
        budget: params.budget,
        memberCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const leagueId = leagueRef.id;

      await firestore()
        .collection(LEAGUE_COLLECTION)
        .doc(leagueId)
        .collection(LEAGUE_MEMBERS_COLLECTION)
        .doc(userId)
        .set({
          userId,
          isAdmin: true,
          joinedAt: new Date(),
        });

      const leagueDoc = await leagueRef.get();
      const data = leagueDoc.data();

      return {
        budget: data?.budget,
        id: leagueDoc.id,
        name: data?.name,
        numberOfTeams: data?.numberOfTeams,
        memberCount: data?.memberCount,
      };
    } catch (error) {
      console.error("Error creating league:", error);
      throw error;
    }
  };
}
