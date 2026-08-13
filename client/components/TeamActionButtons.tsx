import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import FloatingActionButton from "./FloatingActionButton";
import Spinner from "./Spinner";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { resetToSavedTeam, saveTeam } from "@/state/slices/teamSlice";
import { resetTeamLineup, saveTeamLineup } from "@/utils/teamUtils";

const TeamActionButtons = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const team = useAppSelector((state) => state.team);
  const userId = useAppSelector((state) => state.user.id);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [showFAB, setShowFAB] = useState(false);

  useEffect(() => {
    setShowFAB(team.hasUserChanges || false);
  }, [team.hasUserChanges]);

  const handleSave = () => {
    dispatch(saveTeam());
    router.dismissTo("/(protected)/(tabs)");
  };

  if (!showFAB) {
    return null;
  }

  return (
    <View className="absolute bottom-10 flex-row gap-4 self-center">
      <FloatingActionButton
        absolute={false}
        buttonBackground="bg-gray-900 border border-purple-500"
        className="flex-1"
        onPress={async () => {
          setIsResetLoading(true);
          try {
            const savedData = await resetTeamLineup(userId, team.id);
            dispatch(
              resetToSavedTeam({
                lineup: savedData.lineup,
                balance: savedData.balance,
              }),
            );
            router.dismissTo("/(protected)/(tabs)");
          } catch (error) {
            console.error("Failed to reset lineup:", error);
          } finally {
            setIsResetLoading(false);
          }
        }}
      >
        {/* TODO: Move this loading check inside FAB itself*/}
        {isResetLoading ? (
          <View className="items-center justify-center">
            <Spinner />
          </View>
        ) : (
          <Text className="pbk-h6 text-center text-base-white">RESET</Text>
        )}
      </FloatingActionButton>

      <FloatingActionButton
        absolute={false}
        buttonBackground="bg-purple-500"
        className="flex-1"
        onPress={async () => {
          await saveTeamLineup(userId, team, {
            onStart: () => setIsSaveLoading(true),
            onSuccess: () => handleSave(),
            onFinally: () => setIsSaveLoading(false),
          });
        }}
      >
        {isSaveLoading ? (
          <View className="items-center justify-center">
            <Spinner />
          </View>
        ) : (
          <Text className="pbk-h6 text-center text-base-white">SAVE TEAM</Text>
        )}
      </FloatingActionButton>
    </View>
  );
};

export default TeamActionButtons;
