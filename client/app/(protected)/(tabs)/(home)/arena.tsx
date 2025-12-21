import { getAuth } from "@react-native-firebase/auth";
import { useFocusEffect } from "@react-navigation/native";
import { Empty, MagnifyingGlass } from "phosphor-react-native";
import { useCallback, useRef, useState } from "react";
import { Text, View, Image, Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import AugmentCard, { iconMap } from "@/components/AugmentCard";
import DateSelector from "@/components/DateSelector";
import Dialog from "@/components/Dialog";
import PlayerMatchupCard from "@/components/PlayerMatchupCard";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import {
  selectMatchup,
  updateMatchupWithLiveData,
} from "@/state/slices/matchupSlice";
import { selectTeam, selectTeamLogo } from "@/state/slices/teamSlice";
import { themes } from "@/theme/theme";
import { useAppTheme } from "@/theme/ThemeProvider";
import { defaultTeamLogo, teamLogoOptions } from "@/types/asset";
import { SLOT_ORDER } from "@/types/team";
import { isNil, isNotNil } from "@/utils/jsUtils";

const LIVE_DATA_URL =
  "https://us-central1-rookies-fantasy-development.cloudfunctions.net/getLiveData";

const getCurrentWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Find Sunday of this week
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);

  // Saturday of this week
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
  const teamLogo = useAppSelector(selectTeamLogo);
  const queueStatus = useAppSelector((state) => state.user.queueStatus);
  const dispatch = useAppDispatch();
  const { theme, mode } = useAppTheme();

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0], // Only take the day, and take today as the default
  );
  const [selectedAugment, setSelectedAugment] = useState<
    "away" | "home" | null
  >(null);

  const currentWeekDates = getCurrentWeekDates();
  const isQueuing = queueStatus === "queued";

  const matchupRef = useRef(matchup);
  matchupRef.current = matchup;

  useFocusEffect(
    useCallback(() => {
      const fetchLiveData = async () => {
        const awayLineup =
          matchupRef.current?.dailyMatchups[selectedDate]?.awayTeam.lineup ??
          [];
        const homeLineup =
          matchupRef.current?.dailyMatchups[selectedDate]?.homeTeam.lineup ??
          [];

        const awayPlayerIds = awayLineup.map((o) => o.player?.id);
        const homePlayerIds = homeLineup.map((o) => o.player?.id);

        try {
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (!currentUser) {
            console.error("No authenticated user");
            return;
          }

          const idToken = await currentUser.getIdToken();

          const [awayRes, homeRes] = await Promise.all([
            fetch(LIVE_DATA_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ playerIds: awayPlayerIds }),
            }),
            fetch(LIVE_DATA_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ playerIds: homePlayerIds }),
            }),
          ]);

          const [updatedAway, updatedHome] = await Promise.all([
            awayRes.json(),
            homeRes.json(),
          ]);

          dispatch(
            updateMatchupWithLiveData({
              date: selectedDate,
              updatedHome,
              updatedAway,
            }),
          );
        } catch (error) {
          console.log(error);
        }
      };

      fetchLiveData();

      const intervalId = setInterval(fetchLiveData, 10000);

      return () => clearInterval(intervalId);
    }, [selectedDate, dispatch]),
  );

  const dailyMatchup = matchup?.dailyMatchups[selectedDate];
  const awayLineup = dailyMatchup?.awayTeam.lineup ?? [];
  const homeLineup = dailyMatchup?.homeTeam.lineup ?? [];

  const awayTeamLogo = teamLogoOptions.find(
    (asset) => asset.url === matchup?.away.awayTeamLogo,
  )?.source;

  return (
    <View className="flex-1 flex-col items-center bg-gray-950">
      <View className="w-full flex-row">
        <View className="w-1/2 border-b border-r border-gray-900 py-4 pl-6 pr-2">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Image
              className="h-12 w-12 rounded-full border-2"
              source={teamLogo}
            />

            <Text className="pbk-h5 text-base-white">
              {dailyMatchup?.homeTeam.score ?? "--"}
            </Text>
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            {team.name?.toUpperCase()}
          </Text>
        </View>

        <View className="w-1/2 items-end border-b border-l border-gray-900 py-4 pl-2 pr-6">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Text className="pbk-h5 text-base-white">
              {dailyMatchup?.awayTeam.score ?? "--"}
            </Text>

            <Image
              className="h-12 w-12 rounded-full border-2"
              source={awayTeamLogo ?? defaultTeamLogo.source}
            />
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            {matchup?.away.awayTeamName?.toUpperCase() ?? "--"}
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
      {isNotNil(matchup) && matchup.weekStartDate !== currentWeekDates[0] && (
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
      {isNotNil(matchup) && matchup.weekStartDate === currentWeekDates[0] && (
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
              {matchup.home.homeAugment && selectedAugment === "home" && (
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
                      cardData={matchup.home.homeAugment}
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
                {matchup.home.homeAugment && (
                  <View className="flex-col items-center gap-1">
                    <View className="flex-row items-center">
                      <Image
                        className="h-8 w-8"
                        source={iconMap[matchup.home.homeAugment.iconUrl]}
                      />
                      <Text className="pbk-h7 text-base-white">
                        {matchup.home.homeAugment.title.toUpperCase()}
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
              {matchup.away.awayAugment && selectedAugment === "away" && (
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
                      cardData={matchup.away.awayAugment}
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
                {matchup.away.awayAugment && (
                  <View className="flex-col items-center gap-1">
                    <View className="flex-row items-center">
                      <Image
                        className="h-8 w-8"
                        source={iconMap[matchup.away.awayAugment.iconUrl]}
                      />
                      <Text className="pbk-h7 text-base-white">
                        {matchup.away.awayAugment.title.toUpperCase()}
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
