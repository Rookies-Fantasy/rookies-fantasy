import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { defaultPlayer, Player, PlayerFilters } from "@/types/player";
import { isNotNil } from "@/utils/jsUtils";

const PLAYERS_COLLECTION = "nbaPlayers";

export type PlayerFetchParams = {
  pageSize: number;
  pageParam?: FirebaseFirestoreTypes.DocumentSnapshot;
  filters?: PlayerFilters;
  excludedPlayerIds?: string[];
};

export type PlayerFetchResult = {
  players: Player[];
  lastDoc?: FirebaseFirestoreTypes.DocumentSnapshot;
  hasMore: boolean;
};

export class NbaPlayersController {
  static getPlayer = async (playerId: string): Promise<Player> => {
    try {
      const player = await firestore()
        .collection(PLAYERS_COLLECTION)
        .doc(playerId)
        .get();

      const data = player.data();
      const avg = data?.averageStats ?? {};

      return player.exists() && isNotNil(data)
        ? {
            averageStats: {
              assists: avg.assists ?? 0,
              blocks: avg.blocks ?? 0,
              fantasyPoints: avg.fantasyPoints ?? 0,
              minutes: avg.minutes ?? 0,
              points: avg.points ?? 0,
              rebounds: avg.rebounds ?? 0,
              steals: avg.steals ?? 0,
              turnovers: avg.turnovers ?? 0,
            },
            firstName: data.firstName,
            gamesPlayed: data.gamesPlayed,
            headshotUrl: data.headshotURL,
            height: data.height,
            id: data.playerId,
            jerseyNumber: data.jerseyNumber,
            positions: data.positions,
            salary: data.salary,
            lastName: data.lastName,
            teamAbbreviation: data.teamAbbreviation,
            teamId: data.teamId,
            weight: data.weight,
          }
        : defaultPlayer;
    } catch (error) {
      throw error;
    }
  };

  static getPlayers = async ({
    pageSize,
    pageParam,
    filters,
    excludedPlayerIds,
  }: PlayerFetchParams): Promise<PlayerFetchResult> => {
    try {
      let query = firestore()
        .collection(PLAYERS_COLLECTION)
        .orderBy("salary", "desc");

      if (filters) {
        query = query
          .where("salary", ">=", filters.salaryRange.min)
          .where("salary", "<=", filters.salaryRange.max);

        if (filters.selectedTeams.length > 0) {
          const teamIds = filters.selectedTeams.map((team) => team.id);
          query = query.where("teamId", "in", teamIds);
        }

        if (filters.selectedPositions.length > 0) {
          let positionsToMatch: string[] = [];

          filters.selectedPositions.forEach((pos) => {
            if (pos === "G") {
              positionsToMatch.push("PG", "SG");
            } else if (pos === "F") {
              positionsToMatch.push("SF", "PF", "C");
            } else if (["PG", "SG", "SF", "PF", "C"].includes(pos)) {
              positionsToMatch.push(pos);
            }
          });

          positionsToMatch = [...new Set(positionsToMatch)];

          if (positionsToMatch.length > 0) {
            query = query.where(
              "positions",
              "array-contains-any",
              positionsToMatch,
            );
          }
        }
      }

      query = query.limit(pageSize);

      if (pageParam) {
        query = query.startAfter(pageParam);
      }

      const playerSnapshot = await query.get();
      const playerDocs = playerSnapshot.docs;

      let players: Player[] = playerDocs.map((doc) => {
        const data = doc.data();
        const avg = data.averageStats ?? {};

        return {
          averageStats: {
            assists: avg.assists ?? 0,
            blocks: avg.blocks ?? 0,
            fantasyPoints: avg.fantasyPoints ?? 0,
            minutes: avg.minutes ?? 0,
            points: avg.points ?? 0,
            rebounds: avg.rebounds ?? 0,
            steals: avg.steals ?? 0,
            turnovers: avg.turnovers ?? 0,
          },
          firstName: data.firstName,
          gamesPlayed: data.gamesPlayed,
          headshotUrl: data.headshotURL,
          height: data.height,
          id: data.playerId,
          jerseyNumber: data.jerseyNumber,
          positions: data.positions,
          salary: data.salary,
          lastName: data.lastName,
          teamAbbreviation: data.teamAbbreviation,
          teamId: data.teamId,
          weight: data.weight,
        };
      });

      if (excludedPlayerIds && excludedPlayerIds.length > 0) {
        players = players.filter(
          (player) => !excludedPlayerIds.includes(player.id),
        );
      }

      return {
        players,
        lastDoc: playerDocs[playerDocs.length - 1],
        hasMore: playerDocs.length === pageSize,
      };
    } catch (error) {
      throw error;
    }
  };
}
