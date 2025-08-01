import { Player } from "@/types/players";
import { UserPlus } from "phosphor-react-native";
import { View, Text } from "react-native";

type PlayerSlotProps = {
    position: string;
    playerData: Player;


}

const PlayerSlot = () => {
    return (
        <View className="justify-center min-h-20 w-full bg-gray-920 border rounded-2xl border-gray-900">
            <View className="flex-row justify-between px-3">

                <View className="gap-2 flex-row items-center">
                    <Text className="border border-purple-400 rounded-3xl pbk-h8 text-purple-400 px-4 py-1">PG</Text>
                    <Text className="pbk-b2 text-base-white">Empty player - Tap to add player</Text>
                </View>

                <View className="">
                    <UserPlus color="#6042FF" size={20} />
                </View>
            </View>
        </View>
    );
}

export default PlayerSlot;