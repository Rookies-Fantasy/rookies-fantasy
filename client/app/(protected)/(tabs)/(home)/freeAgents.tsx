import { useInfiniteQuery } from "@tanstack/react-query";
import { Sliders } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { View, Text, KeyboardAvoidingView, Pressable } from "react-native";
import { FetchPlayersParams } from "../../(draft)/(teamBuilder)/players";
import IconButton from "@/components/IconButton";
import PlayerData from "@/components/PlayerData";
import Screen from "@/components/Screen";
import SearchBar from "@/components/SearchBar";
import Spinner from "@/components/Spinner";
import Table from "@/components/Table/Table";
import { NbaPlayersController } from "@/controllers/nbaPlayersController";
import { useAppSelector } from "@/state/hooks";

const PAGE_SIZE = 25;

const FreeAgents = () => {
  const [query, setQuery] = useState("");
  const team = useAppSelector((state) => state.team);

  const fetchFreeAgents = async ({ pageParam }: FetchPlayersParams = {}) =>
    await NbaPlayersController.getFreeAgents(
      PAGE_SIZE,
      team.lineup,
      team.bench,
      pageParam,
    );

  const {
    data,
    isLoading: isLoadingFetch,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["freeAgents", team.hasUserChanges],
    queryFn: fetchFreeAgents,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: undefined,
  });

  const tableData = useMemo(() => {
    const players = data?.pages.flatMap((page) => page.players) || [];

    return players.map((player) => [
      <PlayerData key={player.id} player={player} />,
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
    <Screen edges={["right", "left"]}>
      <KeyboardAvoidingView className="my-4 flex-1">
        <View className="gap-4 px-6">
          <View className="flex-row items-center gap-2">
            <Text className="pbk-h5 text-base-white">FREE AGENTS</Text>
          </View>
          <View className="mb-4 w-full flex-row items-center gap-2">
            <View className="flex-1">
              <SearchBar onChangeText={setQuery} value={query} />
            </View>
            <IconButton
              className="size-12 items-center justify-center rounded-lg border border-gray-800 bg-gray-900"
              icon={<Sliders color="white" />}
              onPress={() => {}}
            />
          </View>
        </View>
        {isLoadingFetch ? (
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
            stickyColumns={1}
            widthClasses={[
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
    </Screen>
  );
};

export default FreeAgents;
