import firestore from "@react-native-firebase/firestore";
import { League, LeagueConfig } from "@/types/league";

const LEAGUE_COLLECTION = "leagues";
const LEAGUE_MEMBERS_COLLECTION = "members";

export type CreateLeagueParams = {
  name: string;
  description?: string;
  seasonStartDate: string;
  config: LeagueConfig;
};

export class LeagueController {
  static createLeague = async (
    userId: string,
    params: CreateLeagueParams,
  ): Promise<League> => {
    try {
      const leagueRef = await firestore()
        .collection(LEAGUE_COLLECTION)
        .add({
          name: params.name,
          description: params.description || "",
          creatorUserId: userId,
          seasonStartDate: params.seasonStartDate,
          status: "open",
          config: params.config,
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
        id: leagueDoc.id,
        name: data?.name,
        description: data?.description,
        creatorUserId: data?.creatorUserId,
        seasonStartDate: data?.seasonStartDate,
        status: data?.status,
        config: data?.config,
        memberCount: data?.memberCount,
      };
    } catch (error) {
      console.error("Error creating league:", error);
      throw error;
    }
  };
}
