import { useState, useEffect } from "react";
import { View, Text, Image } from "react-native";
import BottomSheet from "./BottomSheet";
import Spinner from "./Spinner";
import { NbaPlayersController } from "@/controllers/nbaPlayersController";
import { Player } from "@/types/player";

type PlayerDrawerProps = {
  playerId: string | null;
  setSelectedPlayerId: (selectedPlayerId: string) => void;
  setShowBottomDrawer: (showBottomDrawer: boolean) => void;
  showBottomDrawer: boolean;
};

const PlayerDrawer = ({
  playerId,
  setSelectedPlayerId,
  setShowBottomDrawer,
  showBottomDrawer,
}: PlayerDrawerProps) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);

  const onClose = () => {
    setSelectedPlayerId("");
    setShowBottomDrawer(false);
    setPlayer(null);
  };

  useEffect(() => {
    if (!playerId) return;

    setLoading(true);

    NbaPlayersController.getPlayer(playerId)
      .then((p) => setPlayer(p))
      .finally(() => setLoading(false));
  }, [playerId]);

  return (
    <BottomSheet
      isOpen={showBottomDrawer}
      onClose={onClose}
      snapPoints={["80%"]}
    >
      <View className="flex-1 items-center border-t-2 pt-6">
        {loading ? (
          <Spinner />
        ) : player ? (
          <View className="flex-1 items-center">
            <Image
              className="mb-4 h-24 w-24 rounded-full"
              resizeMode="cover"
              source={{ uri: player.headshotUrl }}
            />

            <Text className="pbk-bl text-center text-base-white">
              {player.firstName} {player.secondName}
            </Text>

            <Text className="pbk-b1 mt-1 text-center text-gray-500">
              Team: {player.teamAbbreviation}
            </Text>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="pbk-b2 text-center text-gray-300">
              This player does not exist.
            </Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};
export default PlayerDrawer;
