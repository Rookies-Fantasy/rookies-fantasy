import { useRouter } from "expo-router";
import { UserPlus, XCircle } from "phosphor-react-native";
import { View, Text, Pressable } from "react-native";
import IconButton from "./IconButton";
import PlayerData from "./PlayerData";
import { useAppDispatch } from "@/state/hooks";
import { removePlayerFromLineup } from "@/state/slices/teamSlice";
import { Player } from "@/types/players";
import { cn } from "@/utils/jsUtils";

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
      className={cn(
        "w-full justify-center",
        isCard && "rounded-2xl border-2 border-gray-900",
        isSelected ? "bg-gray-900" : "bg-gray-920",
      )}
    >
      <View className="min-h-24 flex-row items-center justify-between p-3">
        <Pressable
          className="flex-1 flex-row items-center gap-2"
          onPress={() => {
            if (!playerData)
              router.push("/(protected)/(draft)/(teamBuilder)/players");
          }}
        >
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
        </Pressable>

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
              onPress={() =>
                router.push("/(protected)/(draft)/(teamBuilder)/players")
              }
            />
          ))}
      </View>
    </View>
  );
};

export default PlayerSlot;
