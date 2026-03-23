import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Matchup } from "@/types/matchup";

const MATCHUPS_COLLECTION = "matchups";

export class MatchupController {
  static getUserMatchup = async (teamId: string): Promise<Matchup | null> => {
    try {
      const matchups = await firestore()
        .collection(MATCHUPS_COLLECTION)
        .where(
          firestore.Filter.or(
            firestore.Filter("homeTeam.id", "==", teamId),
            firestore.Filter("awayTeam.id", "==", teamId),
          ),
        )
        .limit(1)
        .get();

      const data = matchups.docs[0].data();

      if (!matchups.empty) {
        const matchup: Matchup = {
          id: data.id,
          weekStartDate: data.weekStartDate,
          homeTeam: data.homeTeam,
          awayTeam: data.awayTeam,
          lineupSnapshots: data.lineupSnapshots,
        };
        return matchup;
      }

      return null;
    } catch (error) {
      console.error("Error fetching user matchup:", error);
      throw error;
    }
  };

  // private static parseMatchupDocument = (
  //   doc: FirebaseFirestoreTypes.QueryDocumentSnapshot,
  // ): Matchup => {
  //   const data = doc.data();

  //   const matchup: Matchup = {
  //     id: doc.id,
  //     away: data.away || {},
  //     home: data.home || {},
  //     status: data.status ?? "active",
  //     weekStartDate: data.weekStartDate,
  //     dailyMatchups: {},
  //   };

  //   Object.keys(data).forEach((key) => {
  //     if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
  //       const dailyData = data[key];

  //       matchup.dailyMatchups[key] = {
  //         awayTeam: dailyData.awayTeam,
  //         homeTeam: dailyData.homeTeam,
  //       };
  //     }
  //   });

  //   return matchup;
  // };
}
