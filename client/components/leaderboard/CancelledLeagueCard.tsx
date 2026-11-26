import { router } from "expo-router";
import { WarningCircle } from "phosphor-react-native";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import LoadingOverlay from "@/components/LoadingOverlay";
import { useDeleteLeague } from "@/hooks/useDeleteLeague";
import { useLeagueDeadlineBounds } from "@/hooks/useLeagueDeadlineBounds";
import { useAppSelector } from "@/state/hooks";
import { selectUserId } from "@/state/slices/userSlice";
import { League } from "@/types/league";
import { isNotNil } from "@/utils/jsUtils";
import {
  getDeadlineRange,
  getLeagueMembership,
  isLeagueOwner,
} from "@/utils/leagueUtils";

type CancelledLeagueCardProps = {
  league: League;
};

const getNextStep = (isOwner: boolean, canReopen: boolean): string => {
  if (!canReopen) return "It's too late in the season to reopen registration.";
  return isOwner
    ? "Extend the registration deadline so more teams can join."
    : "Waiting on the league owner to extend the registration deadline.";
};

const CancelledLeagueCard = ({ league }: CancelledLeagueCardProps) => {
  const userId = useAppSelector(selectUserId);
  const { bounds } = useLeagueDeadlineBounds();
  const { confirmDelete, isDeleting } = useDeleteLeague();

  const isOwner = isLeagueOwner(league, userId);
  const canReopen =
    isNotNil(bounds) &&
    isNotNil(getDeadlineRange(bounds, league.numberOfTeams));

  return (
    <View className="rounded-lg border border-red-600 bg-red-950 p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <WarningCircle color="#dc2626" size={20} weight="bold" />
        <Text className="pbk-h6 text-base-white">League cancelled</Text>
      </View>
      <Text className="pbk-b2 text-gray-300">
        Only {getLeagueMembership(league)} of {league.numberOfTeams} teams
        joined before registration closed. {getNextStep(isOwner, canReopen)}
      </Text>
      {isOwner && isNotNil(bounds) && (
        <View className="mt-4">
          {canReopen ? (
            <Button
              label="Extend Registration"
              onPress={() => router.push("/(protected)/editLeague")}
            />
          ) : (
            <Button
              label="Delete League"
              onPress={() => confirmDelete(league)}
              variant="secondary"
            />
          )}
        </View>
      )}
      <LoadingOverlay isVisible={isDeleting} label="Deleting league..." />
    </View>
  );
};

export default CancelledLeagueCard;
