import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ArrowLeft, Minus, Plus, Sliders, X } from "phosphor-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FiltersDrawer from "@/components/FiltersDrawer";
import IconButton from "@/components/IconButton";
import PlayerData from "@/components/PlayerData";
import SearchBar from "@/components/SearchBar";
import Spinner from "@/components/Spinner";
import Table from "@/components/Table/Table";
import TeamActionButtons from "@/components/TeamActionButtons";
import TeamBudget from "@/components/TeamBudget";
import { NbaPlayersController } from "@/controllers/nbaPlayersController";
import { NbaTeamsController } from "@/controllers/nbaTeamsController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  addPlayerToLineup,
  isPlayerInLineup,
  removePlayerFromLineup,
  resetToSavedTeam,
} from "@/state/slices/teamSlice";
import { NbaTeam } from "@/types/nbaTeams";
import { Position, FlexPosition, UTIL_POSITIONS } from "@/types/teamTypes";

import { resetTeamLineup } from "@/utils/teamUtils";

type FetchPlayersParams = {
  pageParam?: FirebaseFirestoreTypes.DocumentSnapshot;
};

export type PositionOption = Position | "ALL" | "G" | "F";

export type Filters = {
  selectedTeams: NbaTeam[];
  selectedPositions: PositionOption[];
  salaryRange: { min: number; max: number };
};

const PAGE_SIZE = 25;

const Players = () => {
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<NbaTeam[]>([]);
  const [filters, setFilters] = useState<Filters>({
    selectedTeams: [],
    selectedPositions: [],
    salaryRange: { min: 1000000, max: 150000000 },
  });
  const team = useAppSelector((state) => state.team);
  const userId = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const fetchPlayersWithAverages = async ({
    pageParam,
  }: FetchPlayersParams = {}) =>
    await NbaPlayersController.getPlayers(PAGE_SIZE, pageParam);

  const {
    data,
    isLoading: isLoadingFetch,
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching teams...");
        const teamsData = await NbaTeamsController.getAllTeams();
        console.log("Teams fetched:", teamsData.length);
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchData();
  }, []);

  const tableData = useMemo(() => {
    const players = data?.pages.flatMap((page) => page.players) || [];

    const checkRosterAvailability = (player: any) => {
      const positions = player.positions || [];
      const hasAvailablePosition = team.lineup.some(
        (slot) =>
          slot.player === null &&
          (positions.includes(slot.position) ||
            UTIL_POSITIONS.includes(slot.position as FlexPosition)),
      );

      return hasAvailablePosition;
    };

    return players.map((player) => [
      <IconButton
        className={
          isPlayerInLineup(team.lineup, player.id)
            ? "bg-red-600"
            : "bg-purple-600"
        }
        icon={
          isPlayerInLineup(team.lineup, player.id) ? (
            <Minus color="white" size={12} />
          ) : (
            <Plus color="white" size={12} />
          )
        }
        key={player.id}
        onPress={() => {
          if (isPlayerInLineup(team.lineup, player.id)) {
            dispatch(removePlayerFromLineup(player));
          } else {
            if (checkRosterAvailability(player)) {
              dispatch(addPlayerToLineup(player));
            } else {
              Alert.alert("Cannot add player", "No eligible spot available");
            }
          }
        }}
      />,
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
  }, [data?.pages, dispatch, team.lineup]);

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
                <IconButton
                  className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                  icon={<ArrowLeft color="white" size={20} weight="bold" />}
                  onPress={async () => {
                    const savedData = await resetTeamLineup(userId, team.id);
                    dispatch(
                      resetToSavedTeam({
                        lineup: savedData.lineup,
                        balance: savedData.balance,
                      }),
                    );
                    router.back();
                  }}
                />
                <Text className="pbk-h5 text-base-white">Team builder</Text>
              </View>
              <IconButton
                className="size-10 items-center justify-center rounded-md border border-gray-900 p-4"
                icon={<X color="white" size={20} weight="bold" />}
                onPress={() => router.dismissAll()}
              />
            </View>

            <TeamBudget />

            <View className="my-10 w-full flex-row items-center gap-4">
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
              stickyColumns={2}
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
        <TeamActionButtons />
      </Pressable>
      <FiltersDrawer
        filters={filters}
        setFilters={setFilters}
        setShowFiltersDrawer={() => setShowFiltersDrawer(false)}
        showFiltersDrawer={showFiltersDrawer}
        teams={teams}
      />
    </SafeAreaView>
  );
};

export default Players;
