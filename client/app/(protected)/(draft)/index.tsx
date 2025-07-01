import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
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
import SearchBar from "@/components/SearchBar";
import Spinner from "@/components/Spinner";
import PlayersTable from "@/components/Table/PlayersTable";
import TeamBudget from "@/components/TeamBudget";
import { NBAPlayersController } from "@/controllers/nbaPlayersController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { addPlayer, removePlayer } from "@/state/slices/lineupSlice";

type FetchPlayersParams = {
  pageParam?: FirebaseFirestoreTypes.DocumentSnapshot;
};

const Players = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const lineup = useAppSelector((state) => state.lineup.players);

  const isPlayerInLineup = (id: string) =>
    lineup.some((player) => player.id === id);

  const fetchPlayersWithAverages = async ({
    pageParam,
  }: FetchPlayersParams = {}) => {
    const PAGE_SIZE = 25;

    return await NBAPlayersController.getFreeAgents(PAGE_SIZE, pageParam);
  };

  const {
    data,
    isLoading,
    isError,
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

  const players = data?.pages.flatMap((page) => page.players) || [];

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
            <Text className="pbk-b2 text-base-white">
              {player.teamAbbreviation}
            </Text>
            <Text className="pbk-b2 text-base-white">
              {player.positions.join(", ")}
            </Text>
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

          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <Text className="text-pbk-bl text-base-white">
              Something went wrong
            </Text>
          ) : (
            <ScrollView
              className="flex-1"
              onScroll={({ nativeEvent }) => {
                const { layoutMeasurement, contentOffset, contentSize } =
                  nativeEvent;
                const isBottom =
                  layoutMeasurement.height + contentOffset.y >=
                  contentSize.height - 50;

                if (isBottom && hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              scrollEventThrottle={200}
            >
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
              />
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default Players;
