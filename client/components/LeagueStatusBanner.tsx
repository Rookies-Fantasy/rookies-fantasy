import Constants from "expo-constants";
import { router } from "expo-router";
import { CaretRight, WarningCircle } from "phosphor-react-native";
import { Pressable, Share, Text, View } from "react-native";
import { useSyncedLeague } from "@/hooks/useSyncedLeague";
import { League } from "@/types/league";
import {
  getLeagueMembership,
  isLeagueCancelled,
  isLeagueOpen,
} from "@/utils/leagueUtils";

const CancelledLeagueNotice = () => (
  <Pressable
    accessibilityRole="button"
    className="mx-8 mt-4 flex-row items-center gap-3 rounded-lg border border-red-600 bg-red-950 px-4 py-3"
    onPress={() => router.push("/(protected)/(tabs)/leaderboard")}
  >
    <WarningCircle color="#dc2626" size={20} weight="bold" />
    <View className="flex-1">
      <Text className="pbk-b1 text-base-white">League cancelled</Text>
      <Text className="pbk-b3 text-gray-300">
        Not enough teams joined before registration closed.
      </Text>
    </View>
    <CaretRight color="white" size={16} weight="bold" />
  </Pressable>
);

type InviteFriendsButtonProps = {
  leagueId: string;
};

const InviteFriendsButton = ({ leagueId }: InviteFriendsButtonProps) => (
  <Pressable
    className="mx-8 mt-4 rounded-lg bg-primary-500 p-4"
    onPress={async () => {
      const baseUrl = Constants.expoConfig?.extra?.baseUrl;
      const inviteUrl = `${baseUrl}/joinLeague?leagueId=${leagueId}`;

      await Share.share({
        message: `Join my league on Rookies Fantasy!\n`,
        url: inviteUrl,
      });
    }}
  >
    <Text className="pbk-h6 text-center text-base-white">INVITE FRIENDS</Text>
  </Pressable>
);

type LeagueStatusBannerProps = {
  league: League;
};

const LeagueStatusBanner = ({
  league: storedLeague,
}: LeagueStatusBannerProps) => {
  const league = useSyncedLeague(storedLeague);

  if (isLeagueCancelled(league)) {
    return <CancelledLeagueNotice />;
  }

  const hasOpenSeats = getLeagueMembership(league) < league.numberOfTeams;
  if (hasOpenSeats && isLeagueOpen(league)) {
    return <InviteFriendsButton leagueId={league.id} />;
  }

  return null;
};

export default LeagueStatusBanner;
