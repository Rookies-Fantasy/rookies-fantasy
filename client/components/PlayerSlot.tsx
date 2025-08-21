import { useRouter } from "expo-router";
import { UserPlus, XCircle } from "phosphor-react-native";
import { View, Text, Pressable } from "react-native";
import IconButton from "./IconButton";
import PlayerData from "./PlayerData";
import { useAppDispatch } from "@/state/hooks";
import {
  removePlayerFromLineup,
  removePlayerFromBench,
} from "@/state/slices/teamSlice";
import { Player } from "@/types/players";
import { cn } from "@/utils/jsUtils";

type PlayerSlotProps = {
  isCard?: boolean;
  enableActionIcon?: boolean;
  position: string;
  playerData: Player | null;
  openDrawer?: () => void;
  isSelected?: boolean;
  onPlayerRemove?: () => void;
};

const PlayerSlot = ({
  isCard = false,
  enableActionIcon = false,
  isSelected,
  position,
  playerData,
  openDrawer,
  onPlayerRemove,
}: PlayerSlotProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const renderActionIcon = () => {
    if (!enableActionIcon || !isCard) return null;
    if (playerData) {
      return (
        <IconButton
          icon={<XCircle color="#535862" size={20} />}
          onPress={() => {
            if (position.startsWith("BEN")) {
              dispatch(removePlayerFromBench(playerData));
            } else {
              dispatch(removePlayerFromLineup(playerData));
            }
            onPlayerRemove?.();
          }}
        />
      );
    }
    return (
      <IconButton
        icon={<UserPlus color="#6042FF" size={20} />}
        onPress={() => router.push("/(protected)/(draft)/(teamBuilder)/roster")}
      />
    );
  };

  return (
    <View
      className={cn(
        "w-full justify-center",
        isCard && "rounded-2xl border-2 border-gray-900",
        isSelected ? "bg-gray-900" : "bg-gray-920",
      )}
    >
      <View className="min-h-24 flex-row items-center justify-between p-3">
        <View className="flex-1 flex-row items-center gap-2">
          <Pressable
            className={cn(
              "h-8 min-w-16 items-center justify-center rounded-3xl",
              isSelected ? "bg-purple-400" : "border border-purple-400",
            )}
            onPress={openDrawer}
          >
            <Text
              className={cn(
                "pbk-h8",
                isSelected ? "text-gray-900" : "text-purple-400",
              )}
            >
              {position}
            </Text>
          </Pressable>
          <View className="flex-1">
            {playerData ? (
              <PlayerData player={playerData} />
            ) : (
              <Text className="pbk-b2 ml-2 text-base-white">Empty slot</Text>
            )}
          </View>
        </View>

        {renderActionIcon()}
      </View>
    </View>
  );
};

export default PlayerSlot;
