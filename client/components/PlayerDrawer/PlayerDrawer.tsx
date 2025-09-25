import { User, ChartLine } from "phosphor-react-native";
import { useState, useEffect } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import BottomSheet from "../BottomSheet";
import Spinner from "../Spinner";
import Tabs from "../Tabs";
import PlayerInfo from "./PlayerInfo";
import PlayerStats from "./PlayerStats";
import { NbaPlayersController } from "@/controllers/nbaPlayersController";
import { Player } from "@/types/player";

enum PlayerTabKey {
  Info = "info",
  Stats = "stats",
}

type PlayerDrawerProps = {
  playerId: string | null;
  setSelectedPlayerId: (selectedPlayerId: string) => void;
  setShowPlayerDrawer: (showPlayerDrawer: boolean) => void;
  showPlayerDrawer: boolean;
};

const PlayerDrawer = ({
  playerId,
  setSelectedPlayerId,
  setShowPlayerDrawer,
  showPlayerDrawer,
}: PlayerDrawerProps) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);

  const onClose = () => {
    setSelectedPlayerId("");
    setShowPlayerDrawer(false);
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
      isOpen={showPlayerDrawer}
      onClose={onClose}
      snapPoints={["80%"]}
    >
      <ScrollView
        className="flex-1 pt-6"
        contentContainerClassName="items-center"
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Spinner />
        ) : player ? (
          <View className="w-full flex-1 items-center">
            <Image
              className="mb-4 h-24 w-24 rounded-full border border-gray-800 bg-gray-950"
              resizeMode="cover"
              source={{ uri: player.headshotUrl }}
            />
            <Text className="pbk-bl text-center text-base-white">
              {player.firstName} {player.lastName}
            </Text>
            {/* TODO: Replace with team name when available*/}
            <Text className="pbk-b1 mt-1 text-center text-gray-500">
              {player.teamAbbreviation}
            </Text>

            <Tabs
              items={[
                {
                  key: PlayerTabKey.Info,
                  icon: (color) => <User color={color} size={20} />,
                  content: <PlayerInfo player={player} />,
                },
                {
                  key: PlayerTabKey.Stats,
                  icon: (color) => <ChartLine color={color} size={20} />,
                  content: <PlayerStats player={player} />,
                },
              ]}
            />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="pbk-b2 text-center text-gray-300">
              This player does not exist.
            </Text>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
};
export default PlayerDrawer;
