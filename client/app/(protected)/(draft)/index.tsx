import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Sliders } from "phosphor-react-native";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-virtualized-view";
import PlayersTable from "@/components/PlayersTable";
import SearchBar from "@/components/SearchBar";
import Spinner from "@/components/Spinner";
import TeamBudget from "@/components/TeamBudget";
import { Player } from "@/types/players";
type FetchPlayersParams = {
  pageParam?: FirebaseFirestoreTypes.DocumentSnapshot;
};

const headers = [
  "ACTION",
  "PLAYER",
  "GP",
  "MIN",
  "PTS",
  "REB",
  "AST",
  "STL",
  "BLK",
  "TO",
  "FPTS",
  "T.FPTS",
];

const columnWidthClasses = [
  "w-24", // ACTION
  "w-48", // PLAYER
  "w-24", // GAMES PLAYED
  "w-24", // MIN
  "w-24", // PTS
  "w-24", // REB
  "w-24", // AST
  "w-24", // STL
  "w-24", // BLK
  "w-24", // TO
  "w-24", // FPTS
  "w-24", // T.FPTS
];

const stickyHeaders = headers.slice(0, 2); // ACTION, PLAYER
const scrollableHeaders = headers.slice(2);

const stickyWidths = columnWidthClasses.slice(0, 2);
const scrollableWidths = columnWidthClasses.slice(2);

const Players = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const fetchPlayersWithAverages = async ({
    pageParam,
  }: FetchPlayersParams = {}) => {
    const PAGE_SIZE = 10;

    let query = firestore()
      .collection("nbaPlayers")
      .orderBy("lastName")
      .limit(PAGE_SIZE);

    if (pageParam) {
      query = query.startAfter(pageParam);
    }

    const playerSnapshot = await query.get();
    const playerDocs = playerSnapshot.docs;

    const playerIds = playerDocs.map((doc) => doc.data().playerId);

    const averagesSnapshot = await firestore()
      .collection("nbaPlayerAverages")
      .where("playerId", "in", playerIds)
      .get();

    const averagesMap = new Map<string, any>();
    averagesSnapshot.docs.forEach((doc) => {
      averagesMap.set(doc.data().playerId, doc.data());
    });

    const players: Player[] = playerDocs.map((doc) => {
      const data = doc.data();
      const averageData = averagesMap.get(data.playerId);
      const gamesPlayed = averageData?.gamesPlayed ?? 0;
      const avg = averageData?.averageStats ?? {};

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
        gamesPlayed,
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
  };

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["nbaPlayers"],
    queryFn: fetchPlayersWithAverages,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: undefined,
  });

  if (isLoading) return <Spinner />;
  if (isError) return <Text>Error: {error.message}</Text>;

  const players = data?.pages.flatMap((page) => page.players) || [];

  const tableData = players.map((player) => [
    "+",
    `${player.firstName.slice(0, 1)}. ${player.secondName}`,
    player.gamesPlayed,
    player.averageStats.min.toFixed(1),
    player.averageStats.pts.toFixed(1),
    player.averageStats.reb.toFixed(1),
    player.averageStats.ast.toFixed(1),
    player.averageStats.stl.toFixed(1),
    player.averageStats.blk.toFixed(1),
    player.averageStats.tov.toFixed(1),
  ]);

  console.log(tableData);

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 flex-col px-6 py-4"
        >
          <View className="my-12 flex-row items-center justify-between gap-4">
            <Text className="pbk-h5 text-base-white">[S1W1] DRAFT</Text>
            <Pressable
              className="rounded-lg border border-gray-800"
              onPress={() => router.back()}
            >
              <Text className="pbk-h8 p-3 text-white">EXIT DRAFT</Text>
            </Pressable>
          </View>

          <TeamBudget />

          <View className="my-10 w-full flex-row items-center gap-4">
            <View className="flex-1">
              <SearchBar onChangeText={setQuery} value={query} />
            </View>

            <Pressable className="size-12 items-center justify-center rounded-lg border border-gray-800 bg-gray-900">
              <Sliders color="white" />
            </Pressable>
          </View>

          <ScrollView className="flex-1">
            <PlayersTable
              data={tableData}
              onEndReached={handleEndReached}
              scrollableHeaders={scrollableHeaders}
              scrollableWidths={scrollableWidths}
              stickyHeaders={stickyHeaders}
              stickyWidths={stickyWidths}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default Players;
