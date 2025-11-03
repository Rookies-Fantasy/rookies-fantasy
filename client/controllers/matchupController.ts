import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Matchup } from "@/types/matchup";

const MATCHUPS_COLLECTION = "matchups";

export class MatchupController {
  static getUserMatchup = async (userId: string): Promise<Matchup | null> => {
    try {
      const matchups = await firestore()
        .collection(MATCHUPS_COLLECTION)
        .where(
          firestore.Filter.or(
            firestore.Filter("home.homeUserId", "==", userId),
            firestore.Filter("away.awayUserId", "==", userId),
          ),
        )
        .limit(1)
        .get();

      if (!matchups.empty) {
        return this.parseMatchupDocument(matchups.docs[0]);
      }

      return null;
    } catch (error) {
      console.error("Error fetching user matchup:", error);
      throw error;
    }
  };

  private static parseMatchupDocument = (
    doc: FirebaseFirestoreTypes.QueryDocumentSnapshot,
  ): Matchup => {
    const data = doc.data();

    const matchup: Matchup = {
      id: doc.id,
      away: data.away || {},
      home: data.home || {},
      status: data.status ?? "active",
      weekStartDate: data.weekStartDate,
      dailyMatchups: {},
    };

    if (data.weekStartDate) {
      matchup.weekStartDate = data.weekStartDate;
    }

    Object.keys(data).forEach((key) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const dailyData = data[key];

        matchup.dailyMatchups[key] = {
          awayTeam: dailyData.awayTeam,
          homeTeam: dailyData.homeTeam,
        };
      }
    });

    return matchup;
  };
}
