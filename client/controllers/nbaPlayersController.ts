import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Player } from "@/types/players";

const PLAYERS_COLLECTION = "nbaPlayers";

export class NBAPlayersController {
  static getFreeAgents = async (
    PAGE_SIZE: number,
    pageParam?: FirebaseFirestoreTypes.DocumentSnapshot,
  ): Promise<{
    players: Player[];
    lastDoc?: FirebaseFirestoreTypes.DocumentSnapshot;
    hasMore: boolean;
  }> => {
    try {
      let query = await firestore()
        .collection(PLAYERS_COLLECTION)
        .orderBy("lastName")
        .limit(PAGE_SIZE);

      console.log("I am querying");

      if (pageParam) {
        query = query.startAfter(pageParam);
      }

      const playerSnapshot = await query.get();
      const playerDocs = playerSnapshot.docs;

      const players: Player[] = playerDocs.map((doc) => {
        const data = doc.data();
        const avg = data.averageStats ?? {};

        return {
          id: data.playerId,
          firstName: data.firstName,
          secondName: data.lastName,
          height: data.height,
          weight: data.weight,
          teamId: data.teamId,
          jerseyNumber: data.jerseyNumber,
          positions: data.positions,
          headshotUrl: data.headshotURL,
          teamAbbreviation: data.teamAbbreviation,
          gamesPlayed: data.gamesPlayed,
          averageStats: {
            min: avg.minutes ?? 0,
            pts: avg.points ?? 0,
            reb: avg.rebounds ?? 0,
            ast: avg.assists ?? 0,
            stl: avg.steals ?? 0,
            blk: avg.blocks ?? 0,
            tov: avg.turnovers ?? 0,
          },
        };
      });

      return {
        players,
        lastDoc: playerDocs[playerDocs.length - 1],
        hasMore: playerDocs.length === PAGE_SIZE,
      };
    } catch (error) {
      throw error;
    }
  };
}
