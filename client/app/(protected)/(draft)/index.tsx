import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Minus, Plus, Sliders } from "phosphor-react-native";
import { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import IconButton from "@/components/IconButton";
import PlayersTable from "@/components/PlayersTable";
import SearchBar from "@/components/SearchBar";
import Spinner from "@/components/Spinner";
import TeamBudget from "@/components/TeamBudget";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { addPlayer, removePlayer } from "@/state/slices/lineupSlice";
import { Player } from "@/types/players";

type FetchPlayersParams = {
  pageParam?: FirebaseFirestoreTypes.DocumentSnapshot;
};

const dummyPlayer = [
  {
    id: "2",
    firstName: "John",
    secondName: "Gilgeous-Alexander",
    height: "6-5",
    weight: "200",
    teamId: "12",
    jerseyNumber: "12",
    positions: ["G", "F"],
    headshotUrl:
      "https://cdn.nba.com/headshots/nba/latest/1040x760/1627759.png",
    gamesPlayed: 57,
    averageStats: {
      min: 0.8,
      pts: 0.8,
      reb: 0.8,
      ast: 0.8,
      stl: 0.8,
      blk: 0.8,
      tov: 0.8,
    },
  },
];

const Players = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lineup = useAppSelector((state) => state.lineup.players);

  const isPlayerInLineup = (id: string) =>
    lineup.some((player) => player.id === id);

  // const fetchPlayersWithAverages = async ({
  //   pageParam,
  // }: FetchPlayersParams = {}) => {
  //   const PAGE_SIZE = 25;

  //   let query = firestore()
  //     .collection("nbaPlayers")
  //     .orderBy("lastName")
  //     .limit(PAGE_SIZE);

  //   if (pageParam) {
  //     query = query.startAfter(pageParam);
  //   }

  //   const playerSnapshot = await query.get();
  //   const playerDocs = playerSnapshot.docs;

  //   const players: Player[] = playerDocs.map((doc) => {
  //     const data = doc.data();
  //     const avg = data.averageStats ?? {};

  //     // return {
  //     //   id: data.playerId,
  //     //   firstName: data.firstName,
  //     //   secondName: data.lastName,
  //     //   height: data.height,
  //     //   weight: data.weight,
  //     //   teamId: data.teamId,
  //     //   jerseyNumber: data.jerseyNumber,
  //     //   positions: data.positions,
  //     //   headshotUrl: data.headshotURL,
  //     //   gamesPlayed: data.gamesPlayed,
  //     //   averageStats: {
  //     //     min: avg.minutes ?? 0,
  //     //     pts: avg.points ?? 0,
  //     //     reb: avg.rebounds ?? 0,
  //     //     ast: avg.assists ?? 0,
  //     //     stl: avg.steals ?? 0,
  //     //     blk: avg.blocks ?? 0,
  //     //     tov: avg.turnovers ?? 0,
  //     //   },
  //     //   // TODO: ADD FPTS and T.FPTS
  //     // };
  //   });

  //   return {
  //     players,
  //     lastDoc: playerDocs[playerDocs.length - 1],
  //     hasMore: playerDocs.length === PAGE_SIZE,
  //   };
  // };

  // const {
  //   data,
  //   isLoading,
  //   isError,
  //   fetchNextPage,
  //   hasNextPage,
  //   isFetchingNextPage,
  // } = useInfiniteQuery({
  //   queryKey: ["nbaPlayers"],
  //   queryFn: fetchPlayersWithAverages,
  //   getNextPageParam: (lastPage) =>
  //     lastPage.hasMore ? lastPage.lastDoc : undefined,
  //   initialPageParam: undefined,
  // });

  const players = dummyPlayer;

  const tableData = players.map((player) => [
    <IconButton
      className={isPlayerInLineup(player.id) ? "bg-red-600" : "bg-green-700"}
      icon={
        isPlayerInLineup(player.id) ? (
          <Minus color="white" size={12} />
        ) : (
          <Plus color="white" size={12} />
        )
      }
      key={player.id}
      onPress={() =>
        isPlayerInLineup(player.id)
          ? dispatch(removePlayer(player.id))
          : dispatch(addPlayer(player))
      }
    />,
    <View key={player.id}>
      <View className="flex-row gap-2">
        <Image
          className="size-14 rounded-full"
          source={{ uri: player.headshotUrl }}
        />
        <View className="max-w-32">
          <Text
            className="pbk-b2 text-base-white"
            ellipsizeMode="tail"
            numberOfLines={1}
          >
            {player.firstName.slice(0, 1)}. {player.secondName}
          </Text>
          <Text className="pbk-b2 text-green-400">$25,000,000</Text>
          <View className="flex-1 flex-row gap-2">
            <Text className="pbk-b2 text-base-white">BOS</Text>
            <Text className="pbk-b2 text-base-white">PF, SF</Text>
          </View>
        </View>
      </View>
    </View>,
    player.gamesPlayed,
    player.averageStats.min.toFixed(1),
    player.averageStats.pts.toFixed(1),
    player.averageStats.reb.toFixed(1),
    player.averageStats.ast.toFixed(1),
    player.averageStats.stl.toFixed(1),
    player.averageStats.blk.toFixed(1),
    player.averageStats.tov.toFixed(1),
  ]);

  // const handleEndReached = () => {
  //   if (hasNextPage && !isFetchingNextPage) {
  //     fetchNextPage();
  //   }
  // };

  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior="padding"
          className="flex-1 flex-col py-4"
        >
          <View className="px-6">
            <View className="my-12 flex-row items-center justify-between">
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
          </View>

          {/* {isLoading ? (
            <Spinner />
          ) : isError ? (
            <Text className="text-pbk-bl text-base-white">
              Something went wrong
            </Text>
          ) : ( */}
          <ScrollView className="flex-1">
            <PlayersTable
              data={tableData}
              headers={[
                "",
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
              ]}
              stickyIndexes={[0, 1]}
              widthClasses={[
                "w-16",
                "min-w-60",
                "min-w-12",
                "min-w-12",
                "min-w-12",
                "min-w-12",
                "min-w-12",
                "min-w-12",
                "min-w-12",
                "min-w-12",
                "min-w-12",
                "min-w-12",
              ]}
              // onEndReached={handleEndReached}
            />
          </ScrollView>
          {/* )} */}
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default Players;
