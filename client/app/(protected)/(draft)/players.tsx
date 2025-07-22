import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, Sliders, X } from "phosphor-react-native";
import { useMemo, useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IconButton from "@/components/IconButton";
import SearchBar from "@/components/SearchBar";
import Spinner from "@/components/Spinner";
import Table from "@/components/Table/Table";
import TeamBudget from "@/components/TeamBudget";
import { NBAPlayersController } from "@/controllers/nbaPlayersController";

type FetchPlayersParams = {
  pageParam?: FirebaseFirestoreTypes.DocumentSnapshot;
};

const Players = () => {
  const [query, setQuery] = useState("");
  const router = useRouter();

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
    refetch,
  } = useInfiniteQuery({
    queryKey: ["nbaPlayers"],
    queryFn: fetchPlayersWithAverages,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: undefined,
  });

  const tableData = useMemo(() => {
    const players = data?.pages.flatMap((page) => page.players) || [];

    return players.map((player) => [
      <IconButton
        className={false ? "bg-red-600" : "bg-green-700"} // TODO: Check if player is on roster
        icon={
          <Plus color="white" size={12} />

          // TODO:
          //isPlayerInLineup(player.id) ? (
          //   <Minus color="white" size={12} />
          // ) : (
          //   <Plus color="white" size={12} />
          // )
        }
        key={player.id}
        onPress={
          () => console.log("Button pressed")
          /* TODO: 
          // isPlayerInLineup(player.id)
          //   ? dispatch(removePlayerFromLineup(player.id))
          //   : dispatch(
          //       addPlayerToLineup({
          //         player: player,
          //         position: player.positions[0] as keyof Lineup,
          //       }),
          //     )
          */
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
            <Text className="pbk-b2 text-green-400">${player.salary}</Text>
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
      player.averageStats.fpts,
    ]);
  }, [data?.pages]);

  return (
    <SafeAreaView
      className="flex-1 bg-gray-950"
      edges={["top", "right", "left"]}
    >
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView className="flex-1">
          <View className="px-6">
            <View className="mb-10 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Pressable
                  className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                  onPress={() => router.back()}
                >
                  <ArrowLeft color="white" size={20} weight="bold" />
                </Pressable>
                <Text className="pbk-h5 text-base-white">Team builder</Text>
              </View>
              <Pressable
                className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                onPress={() => router.dismissAll()}
              >
                <X color="white" size={20} weight="bold" />
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
            <View className="flex-1 items-center justify-center border-t-2 border-gray-900">
              <Spinner />
            </View>
          ) : isError ? (
            <View className="flex-1 items-center justify-center gap-4 border-t-2 border-gray-900">
              <Text className="pbk-bl text-base-white">
                Something went wrong.
              </Text>
              <Pressable
                className="rounded-md bg-purple-600 p-3"
                onPress={() => refetch()}
              >
                <Text className="pbk-bl text-base-white">Try Again</Text>
              </Pressable>
            </View>
          ) : (
            <Table
              data={tableData}
              hasNextPage={hasNextPage}
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
              ]}
              isFetchingNextPage={isFetchingNextPage}
              onEndReached={() => fetchNextPage()}
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
          )}
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

export default Players;
