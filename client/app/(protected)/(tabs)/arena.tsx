import { useFocusEffect } from "expo-router";
import { Empty, MagnifyingGlass } from "phosphor-react-native";
import { useCallback, useRef, useState } from "react";
import { Text, View, Image, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import AugmentCard, { iconMap } from "@/components/AugmentCard";
import DateSelector from "@/components/DateSelector";
import Dialog from "@/components/Dialog";
import PlayerMatchupCard from "@/components/PlayerMatchupCard";
import { fetchLivePlayerData } from "@/controllers/ballDontLieController";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectMatchup,
  updateMatchupWithLiveData,
} from "@/state/slices/matchupSlice";
import { selectTeam } from "@/state/slices/teamSlice";
import { themes } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";
import { defaultTeamLogo, teamLogoOptions } from "@/types/asset";
import { GameInfo, GameStats } from "@/types/matchup";
import { SLOT_ORDER } from "@/types/team";
import { isNil, isNotNil } from "@/utils/jsUtils";

type LiveData = Record<
  string,
  {
    gameInfo: GameInfo;
    gameStats: GameStats;
  }
>;

const getCurrentWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Find Monday of this week
  const startDate = new Date(today);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(today.getDate() + diff);
  startDate.setHours(0, 0, 0, 0);

  // Sunday of this week
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const dates = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    // Push as YYYY-MM-DD string
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const Arena = () => {
  const matchup = useAppSelector(selectMatchup);
  const team = useAppSelector(selectTeam);
  const userId = useAppSelector((state) => state.user.id);
  const queueStatus = useAppSelector((state) => state.user.queueStatus);
  const dispatch = useAppDispatch();
  const { theme, mode } = useAppTheme();

  // Only take the day, and take today as the default
  const today = new Date().toLocaleDateString("en-CA");

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedAugment, setSelectedAugment] = useState<
    "away" | "home" | null
  >(null);
  const [liveAwayData, setLiveAwayData] = useState<LiveData>({});
  const [liveHomeData, setLiveHomeData] = useState<LiveData>({});

  const currentWeekDates = getCurrentWeekDates();
  const isQueuing = queueStatus === "queued";
  const isHomeUser = matchup?.homeUserId === userId;
  const homeSnapshotLineup = matchup?.homeLineupSnapshots[selectedDate] ?? [];
  const awaySnapshotLineup = matchup?.awayLineupSnapshots[selectedDate] ?? [];
  const homeLineup =
    homeSnapshotLineup.length > 0
      ? homeSnapshotLineup.map((slot) => ({
          player: slot.playerSnapshot,
          gameStats: slot.playerSnapshot.gameStats,
        }))
      : isHomeUser
        ? team.lineup.map((slot) => ({
            player: slot.player,
            gameStats: slot.player
              ? liveHomeData[slot.player.id]?.gameStats
              : undefined,
          }))
        : [];
  const awayLineup =
    awaySnapshotLineup.length > 0
      ? awaySnapshotLineup.map((slot) => ({
          player: slot.playerSnapshot,
          gameStats:
            liveAwayData[slot.playerSnapshot.id]?.gameStats ??
            slot.playerSnapshot.gameStats,
        }))
      : !isHomeUser
        ? team.lineup.map((slot) => ({
            player: slot.player,
            gameStats: slot.player
              ? liveAwayData[slot.player.id]?.gameStats
              : undefined,
          }))
        : [];
  const homeScore =
    matchup?.homeScore ??
    homeLineup.reduce(
      (total, slot) => total + (slot.gameStats?.fantasyPoints ?? 0),
      0,
    );
  const awayScore =
    matchup?.awayScore ??
    awayLineup.reduce(
      (total, slot) => total + (slot.gameStats?.fantasyPoints ?? 0),
      0,
    );

  const matchupRef = useRef(matchup);
  matchupRef.current = matchup;

  useFocusEffect(
    useCallback(() => {
      const fetchAndUpdateLiveData = async () => {
        const awayLineup =
          matchupRef.current?.awayLineupSnapshots[selectedDate] ?? [];
        const homeLineup =
          matchupRef.current?.homeLineupSnapshots[selectedDate] ?? [];

        const homePlayerIds =
          homeLineup.length > 0
            ? homeLineup
                .map((o) => o.playerSnapshot?.id)
                .filter((id) => isNotNil(id))
            : isHomeUser
              ? team.lineup
                  .map((o) => o.player?.id)
                  .filter((id) => isNotNil(id))
              : [];
        const awayPlayerIds =
          awayLineup.length > 0
            ? awayLineup
                .map((o) => o.playerSnapshot?.id)
                .filter((id) => isNotNil(id))
            : !isHomeUser
              ? team.lineup
                  .map((o) => o.player?.id)
                  .filter((id) => isNotNil(id))
              : [];

        try {
          const [updatedAway, updatedHome] = await Promise.all([
            fetchLivePlayerData(awayPlayerIds),
            fetchLivePlayerData(homePlayerIds),
          ]);

          setLiveAwayData(updatedAway ?? {});
          setLiveHomeData(updatedHome ?? {});

          dispatch(
            updateMatchupWithLiveData({
              date: selectedDate,
              updatedHome: updatedHome ?? {},
              updatedAway: updatedAway ?? {},
            }),
          );
        } catch (error) {
          console.log(error);
        }
      };

      fetchAndUpdateLiveData();

      const intervalId = setInterval(fetchAndUpdateLiveData, 10000);

      return () => clearInterval(intervalId);
    }, [isHomeUser, selectedDate, dispatch, team.lineup]),
  );

  const homeTeamLogo = teamLogoOptions.find(
    (asset) => asset.url === matchup?.homeTeamSnapshot.logoUrl,
  )?.source;
  const awayTeamLogo = teamLogoOptions.find(
    (asset) => asset.url === matchup?.awayTeamSnapshot.logoUrl,
  )?.source;

  return (
    <View className="flex-1 flex-col items-center bg-gray-950">
      <View className="w-full flex-row">
        <View className="w-1/2 border-b border-r border-gray-900 py-4 pl-6 pr-2">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Image
              className="h-12 w-12 rounded-full border-2"
              source={homeTeamLogo ?? defaultTeamLogo.source}
            />

            <Text className="pbk-h5 text-base-white">
              {homeScore > 0 ? homeScore : "--"}
            </Text>
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            {matchup?.homeTeamSnapshot.name.toUpperCase() ?? "--"}
          </Text>
        </View>

        <View className="w-1/2 items-end border-b border-l border-gray-900 py-4 pl-2 pr-6">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Text className="pbk-h5 text-base-white">
              {awayScore > 0 ? awayScore : "--"}
            </Text>

            <Image
              className="h-12 w-12 rounded-full border-2"
              source={awayTeamLogo ?? defaultTeamLogo.source}
            />
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            {matchup?.awayTeamSnapshot.name.toUpperCase() ?? "--"}
          </Text>
        </View>
      </View>
      <DateSelector
        currentDate={selectedDate}
        dates={currentWeekDates}
        onDateChange={setSelectedDate}
      />
      {isQueuing && (
        <View className="flex-1 items-center gap-2 px-4 pt-10">
          <MagnifyingGlass
            color={`rgb(${themes[theme][mode].modeContrast})`}
            size={32}
          />
          <Text className="pbk-h8 text-center text-modeContrast">
            Searching for an Opponent
          </Text>
          <Text className="pbk-b2 text-center text-modeContrast">
            {`You're in the queue — finding you a worthy opponent. Shouldn't take long!`}
          </Text>
        </View>
      )}
      {isNil(matchup) && (
        <View className="flex-1 items-center gap-2 px-4 pt-10">
          <Empty color={`rgb(${themes[theme][mode].modeContrast})`} size={32} />
          <Text className="pbk-h8 text-center text-modeContrast">
            No Matchup Yet
          </Text>
          <Text className="pbk-b2 text-center text-modeContrast">
            {`You're not playing against anyone this week. Queue up to get matched up and compete!`}
          </Text>
        </View>
      )}
      {isNotNil(matchup) && matchup.weekStart !== currentWeekDates[0] && (
        <View className="flex-1 items-center gap-2 px-4 pt-10">
          <Empty color={`rgb(${themes[theme][mode].modeContrast})`} size={32} />
          <Text className="pbk-h8 text-center text-modeContrast">
            Check in Next Week!
          </Text>
          <Text className="pbk-b2 text-center text-modeContrast">
            {`You're matched up against an opponent! However, your match is next week. Please come back next week!`}
          </Text>
        </View>
      )}
      {isNotNil(matchup) && matchup.weekStart === currentWeekDates[0] && (
        <ScrollView
          className="mx-4 w-full flex-1"
          contentContainerStyle={{ paddingVertical: 20 }}
        >
          <View className="mb-5 flex-row justify-center gap-5">
            <Pressable
              onPress={() => {
                setSelectedAugment("home");
                setOpenDialog(true);
              }}
            >
              {matchup.homeTeamSnapshot.augmentSnapshot &&
                selectedAugment === "home" && (
                  <Dialog
                    closeLabel="Close"
                    dialogClassname="w-[75%]"
                    onClose={() => {
                      setOpenDialog(false);
                      setSelectedAugment(null);
                    }}
                    title="Home Team Augment"
                    visible={openDialog}
                  >
                    <View className="h-80">
                      <AugmentCard
                        cardData={matchup.homeTeamSnapshot.augmentSnapshot}
                        onPress={() => {
                          setOpenDialog(false);
                          setSelectedAugment(null);
                        }}
                      />
                    </View>
                  </Dialog>
                )}
              <LinearGradient
                colors={["#CCE8FE", "#CDA0FF", "#8489F5", "#CDF1FF", "#B591E9"]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  bottom: -3,
                  left: -3,
                  borderRadius: 16,
                  borderWidth: 1,
                }}
              />
              <View className="w-full rounded-2xl bg-gray-900 p-4">
                {matchup.homeTeamSnapshot.augmentSnapshot && (
                  <View className="flex-col items-center gap-1">
                    <View className="flex-row items-center">
                      <Image
                        className="h-8 w-8"
                        source={
                          iconMap[
                            matchup.homeTeamSnapshot.augmentSnapshot.iconUrl
                          ]
                        }
                      />
                      <Text className="pbk-h7 text-base-white">
                        {matchup.homeTeamSnapshot.augmentSnapshot.title.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                setSelectedAugment("away");
                setOpenDialog(true);
              }}
            >
              {matchup.awayTeamSnapshot.augmentSnapshot &&
                selectedAugment === "away" && (
                  <Dialog
                    closeLabel="Close"
                    dialogClassname="w-[75%]"
                    onClose={() => {
                      setOpenDialog(false);
                      setSelectedAugment(null);
                    }}
                    title="Away Team Augment"
                    visible={openDialog}
                  >
                    <View className="h-80">
                      <AugmentCard
                        cardData={matchup.awayTeamSnapshot.augmentSnapshot}
                        onPress={() => {
                          setOpenDialog(false);
                          setSelectedAugment(null);
                        }}
                      />
                    </View>
                  </Dialog>
                )}
              <LinearGradient
                colors={["#CCE8FE", "#CDA0FF", "#8489F5", "#CDF1FF", "#B591E9"]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  bottom: -3,
                  left: -3,
                  borderRadius: 16,
                  borderWidth: 1,
                }}
              />
              <View className="w-full rounded-2xl bg-gray-900 p-4">
                {matchup.awayTeamSnapshot.augmentSnapshot && (
                  <View className="flex-col items-center gap-1">
                    <View className="flex-row items-center">
                      <Image
                        className="h-8 w-8"
                        source={
                          iconMap[
                            matchup.awayTeamSnapshot.augmentSnapshot.iconUrl
                          ]
                        }
                      />
                      <Text className="pbk-h7 text-base-white">
                        {matchup.awayTeamSnapshot.augmentSnapshot.title.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Pressable>
          </View>

          {SLOT_ORDER.map((position, index) => (
            <PlayerMatchupCard
              awaySlot={awayLineup[index]}
              homeSlot={homeLineup[index]}
              key={position}
              position={position}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default Arena;
