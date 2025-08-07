import { useRouter } from "expo-router";
import { UserPlus, X, XCircle } from "phosphor-react-native";
import { View, Text, Pressable } from "react-native";
import IconButton from "./IconButton";
import PlayerData from "./PlayerData";
import { useAppDispatch } from "@/state/hooks";
import { removePlayerFromLineup } from "@/state/slices/teamSlice";
import { Player } from "@/types/players";

type PlayerSlotProps = {
  isCard?: boolean;
  actionIcon?: boolean;
  position: string;
  playerData: Player | null;
  openDrawer?: () => void;
  isSelected?: boolean;
  onPlayerRemove?: () => void;
};

const PlayerSlot = ({
  isCard = false,
  actionIcon = false,
  isSelected,
  position,
  playerData,
  openDrawer,
  onPlayerRemove,
}: PlayerSlotProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return (
    <View
      className={`w-full justify-center ${isCard ? "rounded-2xl border-2 border-gray-900" : ""} ${isSelected ? "bg-gray-900" : "bg-gray-920"}`}
    >
      <View className="min-h-24 flex-row items-center justify-between p-3">
        <View className="flex-1 flex-row items-center gap-2">
          <Pressable
            className={`h-8 min-w-16 items-center justify-center rounded-3xl ${isSelected ? "bg-purple-400" : "border border-purple-400"}`}
            onPress={openDrawer}
          >
            <Text
              className={`pbk-h8 ${isSelected ? "text-gray-900" : "text-purple-400"}`}
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

        {actionIcon &&
          isCard &&
          (playerData ? (
            <IconButton
              icon={<XCircle color="#535862" size={20} />}
              onPress={() => {
                dispatch(removePlayerFromLineup(playerData));
                onPlayerRemove?.();
              }}
            />
          ) : (
            <IconButton
              icon={<UserPlus color="#6042FF" size={20} />}
              onPress={() => router.push("/(protected)/(draft)/players")}
            />
          ))}
      </View>
      {!actionIcon && isCard && (
        <View className="flex-1 flex-row items-center justify-center gap-2 border-t-2 border-gray-900 p-3">
          <X color="#8175FF" size={20} weight="bold" />
          <Text className="pbk-sh1 text-purple-400">DROP PLAYER</Text>
        </View>
      )}
    </View>
  );
};

export default PlayerSlot;
