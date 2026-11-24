import { router } from "expo-router";
import { PencilSimple } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import LeagueSummary from "@/components/leaderboard/LeagueSummary";
import RankedLeaderboardPlaceholder from "@/components/leaderboard/RankedLeaderboardPlaceholder";
import StandingsLegend from "@/components/leaderboard/StandingsLegend";
import StandingsPodium from "@/components/leaderboard/StandingsPodium";
import StandingsTable from "@/components/leaderboard/StandingsTable";
import YourTeamCallout from "@/components/leaderboard/YourTeamCallout";
import Screen from "@/components/Screen";
import Spinner from "@/components/Spinner";
import { useLeagueStandings } from "@/hooks/useLeagueStandings";
import { useAppSelector } from "@/state/hooks";
import { selectCurrentLeague } from "@/state/slices/leagueSlice";
import { selectUserId } from "@/state/slices/userSlice";
import { League } from "@/types/league";
import { isLeagueOwner } from "@/utils/leagueUtils";

type LeagueStandingsProps = {
  league: League;
};

const LeagueStandings = ({ league }: LeagueStandingsProps) => {
  const userId = useAppSelector(selectUserId);
  const { standings, isLoading, isError, refetch } = useLeagueStandings(league);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="pbk-bl text-center text-base-white">
          Couldn&#39;t load the standings.
        </Text>
        <Pressable
          className="rounded-md bg-purple-600 p-3"
          onPress={() => refetch()}
        >
          <Text className="pbk-bl text-base-white">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (standings.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="pbk-h8 text-center text-modeContrast">
          No Teams Yet
        </Text>
        <Text className="pbk-b2 text-center text-modeContrast">
          Invite friends to your league to start building the standings.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerClassName="gap-6 px-6 pb-24 pt-3"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-1">
          <Text className="pbk-h5 text-base-white" numberOfLines={1}>
            {league.name}
          </Text>
          <Text className="pbk-b2 text-gray-400">Standings</Text>
        </View>
        {isLeagueOwner(league, userId) && (
          <Pressable
            accessibilityLabel="Edit league"
            className="size-10 items-center justify-center rounded-md border border-gray-900"
            onPress={() => router.push("/(protected)/editLeague")}
          >
            <PencilSimple color="white" size={20} weight="bold" />
          </Pressable>
        )}
      </View>
      <StandingsPodium standings={standings} />
      <YourTeamCallout standings={standings} />
      <LeagueSummary standings={standings} />
      <StandingsTable standings={standings} />
      <StandingsLegend />
    </ScrollView>
  );
};

const Leaderboard = () => {
  const currentLeague = useAppSelector(selectCurrentLeague);

  return (
    <Screen edges={["left", "right"]}>
      {currentLeague === null ? (
        <RankedLeaderboardPlaceholder />
      ) : (
        <LeagueStandings league={currentLeague} />
      )}
    </Screen>
  );
};

export default Leaderboard;
