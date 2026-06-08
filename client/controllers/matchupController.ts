import firestore from "@react-native-firebase/firestore";
import { Matchup } from "@/types/matchup";

const MATCHUPS_COLLECTION = "matchups";

export class MatchupController {
  static getUserMatchup = async (userId: string): Promise<Matchup | null> => {
    try {
      const [homeMatchups, awayMatchups] = await Promise.all([
        firestore()
          .collection(MATCHUPS_COLLECTION)
          .where("homeUserId", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get(),
        firestore()
          .collection(MATCHUPS_COLLECTION)
          .where("awayUserId", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get(),
      ]);

      const matchups = homeMatchups.empty ? awayMatchups : homeMatchups;

      return matchups.empty ? null : (matchups.docs[0].data() as Matchup);
    } catch (error) {
      console.error("Error fetching user matchup:", error);
      throw error;
    }
  };
}
