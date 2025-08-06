import { useRouter } from "expo-router";
import { UserPlus, XCircle } from "phosphor-react-native";
import { View, Text, Pressable } from "react-native";
import IconButton from "./IconButton";
import PlayerData from "./PlayerData";
import { useAppDispatch } from "@/state/hooks";
import { removePlayerFromLineup } from "@/state/slices/teamSlice";
import { Player } from "@/types/players";

type PlayerSlotProps = {
  isCard?: boolean;
  position: string;
  playerData: Player | null;
  openDrawer?: () => void;
  isSelected?: boolean;
  onPlayerRemove?: () => void;
};

const PlayerSlot = ({
  isCard = false,
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
      className={`min-h-24 w-full justify-center ${isCard ? "rounded-2xl border border-gray-900" : ""} ${isSelected ? "bg-gray-900" : "bg-gray-920"}`}
    >
      <View className="flex-row items-center justify-between px-3">
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
          {playerData ? (
            <PlayerData player={playerData} />
          ) : (
            <Text className="pbk-b2 ml-2 text-base-white">Empty slot</Text>
          )}
        </View>

        {isCard &&
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
              onPress={() => router.navigate("/(protected)/(draft)/players")}
            />
          ))}
      </View>
    </View>
  );
};

export default PlayerSlot;
