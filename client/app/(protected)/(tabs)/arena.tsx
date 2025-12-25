import { useFocusEffect } from "@react-navigation/native";
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
import { teamLogoOptions } from "@/types/asset";
import { SLOT_ORDER } from "@/types/team";
import { isNotNil } from "@/utils/jsUtils";

const Arena = () => {
  const matchup = useAppSelector(selectMatchup);
  const dispatch = useAppDispatch();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedAugment, setSelectedAugment] = useState<
    "away" | "home" | null
  >(null);

  const availableDates = Object.keys(matchup.dailyMatchups).sort();
  const currentDate = selectedDate || availableDates[0] || "";

  const dailyMatchup = matchup.dailyMatchups[currentDate];

  const awayTeamLogo = teamLogoOptions.find(
    (asset) => asset.url === matchup.away.awayTeamLogo,
  )?.source;

  const homeTeamLogo = teamLogoOptions.find(
    (asset) => asset.url === matchup.home.homeTeamLogo,
  )?.source;

  const awayScore = dailyMatchup?.awayTeam.score ?? 0;
  const homeScore = dailyMatchup?.homeTeam.score ?? 0;

  const matchupRef = useRef(matchup);
  matchupRef.current = matchup;

  useFocusEffect(
    useCallback(() => {
      const fetchAndUpdateLiveData = async () => {
        const awayLineup =
          matchupRef.current.dailyMatchups[currentDate]?.awayTeam.lineup ?? [];
        const homeLineup =
          matchupRef.current.dailyMatchups[currentDate]?.homeTeam.lineup ?? [];

        const awayPlayerIds = awayLineup
          .map((o) => o.player?.id)
          .filter((id) => isNotNil(id));
        const homePlayerIds = homeLineup
          .map((o) => o.player?.id)
          .filter((id) => isNotNil(id));

        try {
          const [updatedAway, updatedHome] = await Promise.all([
            fetchLivePlayerData(awayPlayerIds),
            fetchLivePlayerData(homePlayerIds),
          ]);

          dispatch(
            updateMatchupWithLiveData({
              date: currentDate,
              updatedHome,
              updatedAway,
            }),
          );
        } catch (error) {
          console.log(error);
        }
      };

      fetchAndUpdateLiveData();

      const intervalId = setInterval(fetchAndUpdateLiveData, 10000);

      return () => clearInterval(intervalId);
    }, [currentDate, dispatch]),
  );

  const awayLineup = dailyMatchup?.awayTeam.lineup ?? [];
  const homeLineup = dailyMatchup?.homeTeam.lineup ?? [];

  return (
    <View className="flex-1 flex-col items-center bg-gray-950">
      <View className="w-full flex-row">
        <View className="w-1/2 border-b border-r border-gray-900 py-4 pl-6 pr-2">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Image
              className="h-12 w-12 rounded-full border-2"
              source={homeTeamLogo}
            />

            <Text className="pbk-h5 text-base-white">{homeScore}</Text>
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            {matchup.home.homeTeamName?.toUpperCase()}
          </Text>
        </View>

        <View className="w-1/2 items-end border-b border-l border-gray-900 py-4 pl-2 pr-6">
          <View className="mb-2 w-full flex-row items-start justify-between">
            <Text className="pbk-h5 text-base-white">{awayScore}</Text>

            <Image
              className="h-12 w-12 rounded-full border-2"
              source={awayTeamLogo}
            />
          </View>

          <Text className="pbk-h6 text-base-white" numberOfLines={1}>
            {matchup.away.awayTeamName?.toUpperCase()}
          </Text>
        </View>
      </View>
      <DateSelector
        currentDate={currentDate}
        dates={availableDates}
        onDateChange={setSelectedDate}
      />
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
    </View>
  );
};

export default Arena;
