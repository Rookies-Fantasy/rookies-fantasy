import { User, ChartLine } from "phosphor-react-native";
import { useState, useEffect } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import BottomSheet from "../BottomSheet";
import Spinner from "../Spinner";
import Tabs from "../Tabs";
import PlayerInfo from "./PlayerInfo";
import { NbaPlayersController } from "@/controllers/nbaPlayersController";
import { Player } from "@/types/player";

enum PlayerTabKey {
  Info = "info",
  Stats = "stats",
}

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
      snapPoints={["75%"]}
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
              {player.firstName} {player.secondName}
            </Text>
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
                  content: (
                    <View className="grid grid-cols-2 gap-4">
                      <Text className="text-gray-300">
                        PTS: {player.averageStats.pts}
                      </Text>
                      <Text className="text-gray-300">
                        REB: {player.averageStats.reb}
                      </Text>
                      <Text className="text-gray-300">
                        AST: {player.averageStats.ast}
                      </Text>
                      <Text className="text-gray-300">
                        STL: {player.averageStats.stl}
                      </Text>
                      <Text className="text-gray-300">
                        BLK: {player.averageStats.blk}
                      </Text>
                      <Text className="text-gray-300">
                        TOV: {player.averageStats.tov}
                      </Text>
                      <Text className="text-gray-300">
                        MIN: {player.averageStats.min}
                      </Text>
                      <Text className="text-gray-300">
                        FPTS: {player.averageStats.fpts}
                      </Text>
                    </View>
                  ),
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
