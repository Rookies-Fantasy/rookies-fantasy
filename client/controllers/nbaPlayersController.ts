import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { defaultPlayer, Player, PlayerFilters } from "@/types/player";
import { LineupSlot, BenchSlot } from "@/types/team";
import { isNotNil } from "@/utils/jsUtils";

const PLAYERS_COLLECTION = "nbaPlayers";

type PlayerFetchResult = {
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

  static getPlayers = async (
    PAGE_SIZE: number,
    pageParam?: FirebaseFirestoreTypes.DocumentSnapshot,
    filters?: PlayerFilters,
  ): Promise<PlayerFetchResult> => {
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

      query = query.limit(PAGE_SIZE);

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
          id: doc.id,
          jerseyNumber: data.jerseyNumber,
          positions: data.positions,
          playerId: data.playerId,
          salary: data.salary,
          lastName: data.lastName,
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

  static getFilteredPlayers = async (
    filters: PlayerFilters,
    PAGE_SIZE: number,
    pageParam?: FirebaseFirestoreTypes.DocumentSnapshot,
  ): Promise<PlayerFetchResult> => {
    try {
      let query = firestore()
        .collection(PLAYERS_COLLECTION)
        .orderBy("salary", "desc")
        .limit(PAGE_SIZE);

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

      query = query.limit(PAGE_SIZE);

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
          id: doc.id,
          jerseyNumber: data.jerseyNumber,
          playerId: data.playerId,
          positions: data.positions,
          salary: data.salary,
          lastName: data.lastName,
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

  static getFreeAgents = async (
    PAGE_SIZE: number,
    lineup: LineupSlot[],
    bench: BenchSlot[],
    pageParam?: FirebaseFirestoreTypes.DocumentSnapshot,
  ): Promise<PlayerFetchResult> => {
    try {
      const unavailablePlayerIds: string[] = [];

      lineup.forEach((slot) => {
        if (slot.player) {
          unavailablePlayerIds.push(slot.player.id);
        }
      });

      bench.forEach((slot) => {
        if (slot.player) {
          unavailablePlayerIds.push(slot.player.id);
        }
      });

      let query = firestore()
        .collection(PLAYERS_COLLECTION)
        .orderBy("salary", "desc")
        .limit(PAGE_SIZE);

      if (pageParam) {
        query = query.startAfter(pageParam);
      }

      const playerSnapshot = await query.get();
      const playerDocs = playerSnapshot.docs;

      const players: Player[] = playerDocs
        .map((doc) => {
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
            lastName: data.lastName,
            gamesPlayed: data.gamesPlayed,
            headshotUrl: data.headshotURL,
            height: data.height,
            id: data.playerId,
            jerseyNumber: data.jerseyNumber,
            positions: data.positions,
            salary: data.salary,
            secondName: data.lastName,
            teamAbbreviation: data.teamAbbreviation,
            teamId: data.teamId,
            weight: data.weight,
          };
        })
        .filter((player) => !unavailablePlayerIds.includes(player.id));

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
