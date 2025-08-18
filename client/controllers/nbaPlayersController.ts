import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { Player } from "@/types/players";

const PLAYERS_COLLECTION = "nbaPlayers";

type PlayerFetchResult = {
  players: Player[];
  lastDoc?: FirebaseFirestoreTypes.DocumentSnapshot;
  hasMore: boolean;
};

export class NbaPlayersController {
  static getPlayers = async (
    PAGE_SIZE: number,
    pageParam?: FirebaseFirestoreTypes.DocumentSnapshot,
  ): Promise<PlayerFetchResult> => {
    try {
      let query = firestore()
        .collection(PLAYERS_COLLECTION)
        .orderBy("salary", "desc")
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.startAfter(pageParam);
      }

      const playerSnapshot = await query.get();
      const playerDocs = playerSnapshot.docs;

      const players: Player[] = playerDocs.map((doc) => {
        const data = doc.data();
        const avg = data.averageStats ?? {};

        return {
          averageStats: {
            ast: avg.assists ?? 0,
            blk: avg.blocks ?? 0,
            fpts: avg.fantasyPoints ?? 0,
            min: avg.minutes ?? 0,
            pts: avg.points ?? 0,
            reb: avg.rebounds ?? 0,
            stl: avg.steals ?? 0,
            tov: avg.turnovers ?? 0,
          },
          firstName: data.firstName,
          gamesPlayed: data.gamesPlayed,
          headshotUrl: data.headshotURL,
          height: data.height,
          id: data.playerId,
          jerseyNumber: data.jerseyNumber,
          positions: data.positions,
          salary: data.salary.toLocaleString(),
          secondName: data.lastName,
          teamAbbreviation: data.teamAbbreviation,
          teamId: data.teamId,
          weight: data.weight,
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
