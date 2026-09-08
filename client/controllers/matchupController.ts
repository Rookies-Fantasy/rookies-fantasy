import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Matchup } from "@/types/matchup";

const MATCHUPS_COLLECTION = "matchups";

type FirestoreMatchup = Omit<Matchup, "createdAt"> & {
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt?: FirebaseFirestoreTypes.Timestamp;
};

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

      if (matchups.empty) {
        return null;
      }

      const matchup = matchups.docs[0].data() as FirestoreMatchup;

      return {
        ...matchup,
        createdAt: matchup.createdAt.toDate().toISOString(),
        ...(matchup.updatedAt
          ? { updatedAt: matchup.updatedAt.toDate().toISOString() }
          : {}),
      };
    } catch (error) {
      console.error("Error fetching user matchup:", error);
      throw error;
    }
  };
}
