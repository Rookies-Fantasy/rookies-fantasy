import { useInfiniteQuery } from "@tanstack/react-query";
import { Sliders } from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
import { View, Text, KeyboardAvoidingView, Pressable } from "react-native";
import { FetchPlayersParams } from "../(draft)/(teamBuilder)/players";
import FiltersDrawer from "@/components/FiltersDrawer";
import IconButton from "@/components/IconButton";
import PlayerData from "@/components/PlayerData";
import Screen from "@/components/Screen";
import SearchBar from "@/components/SearchBar";
import Spinner from "@/components/Spinner";
import Table from "@/components/Table/Table";
import { NbaPlayersController } from "@/controllers/nbaPlayersController";
import { NbaTeamsController } from "@/controllers/nbaTeamsController";
import { useAppSelector } from "@/state/hooks";
import { NbaTeam } from "@/types/nbaTeams";
import { defaultPlayerFilters, PlayerFilters } from "@/types/player";

const PAGE_SIZE = 25;

const FreeAgents = () => {
  const [query, setQuery] = useState("");
  const team = useAppSelector((state) => state.team);
  const teamComposition =
    team.lineup.filter((slot) => slot.player).length + team.bench.length;
  const [nbaTeams, setNBATeams] = useState<NbaTeam[]>([]);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [filters, setFilters] = useState<PlayerFilters>({
    selectedTeams: [],
    selectedPositions: [],
    salaryRange: { min: 1000000, max: 150000000 },
  });

  const excludedPlayerIds = useMemo(() => {
    const ids: string[] = [];

    team.lineup.forEach((slot) => {
      if (slot.player) {
        ids.push(slot.player.id);
      }
    });

    team.bench.forEach((slot) => {
      ids.push(slot.player.id);
    });

    return ids;
  }, [team.lineup, team.bench]);

  const fetchFreeAgents = async ({ pageParam }: FetchPlayersParams = {}) =>
    await NbaPlayersController.getPlayers({
      pageSize: PAGE_SIZE,
      pageParam,
      filters: defaultPlayerFilters,
      excludedPlayerIds,
    });

  const {
    data,
    isLoading: isLoadingFetch,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["freeAgents", teamComposition],
    queryFn: fetchFreeAgents,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    initialPageParam: undefined,
  });

  // TODO: Cache or store these assets so we can reduce fetches
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsData = await NbaTeamsController.getAllTeams();
        setNBATeams(teamsData);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchData();
  }, []);

  const tableData = useMemo(() => {
    const players = data?.pages.flatMap((page) => page.players) || [];

    return players.map((player) => ({
      id: player.id,
      cells: [
        <PlayerData key={player.id} player={player} />,
        player.gamesPlayed,
        player.averageStats.minutes.toFixed(1),
        player.averageStats.points.toFixed(1),
        player.averageStats.rebounds.toFixed(1),
        player.averageStats.assists.toFixed(1),
        player.averageStats.steals.toFixed(1),
        player.averageStats.blocks.toFixed(1),
        player.averageStats.turnovers.toFixed(1),
        player.averageStats.fantasyPoints.toFixed(1),
      ],
    }));
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
              onPress={() => setShowFiltersDrawer(true)}
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
      <FiltersDrawer
        filters={filters}
        setFilters={setFilters}
        setShowFiltersDrawer={() => setShowFiltersDrawer(false)}
        showFiltersDrawer={showFiltersDrawer}
        teams={nbaTeams}
      />
    </Screen>
  );
};

export default FreeAgents;
