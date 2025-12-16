import { ListBullets } from "phosphor-react-native";
import { View, Text } from "react-native";
import Table from "../Table/Table";
import { Player } from "@/types/player";

type PlayerStatsProps = {
  player: Player;
};

const PlayerStats = ({ player }: PlayerStatsProps) => {
  const averageStats = [
    {
      id: "season",
      cells: [
        "Season",
        player.averageStats.minutes.toFixed(1),
        player.averageStats.points.toFixed(1),
        player.averageStats.rebounds.toFixed(1),
        player.averageStats.assists.toFixed(1),
        player.averageStats.steals.toFixed(1),
        player.averageStats.blocks.toFixed(1),
        player.averageStats.turnovers.toFixed(1),
        player.averageStats.fantasyPoints.toFixed(1),
      ],
    },
    // TODO: Replace with real data when available
    {
      id: "sevenDays",
      cells: ["Last 7 Days", "--", "--", "--", "--", "--", "--", "--", "--"],
    },
  ];

  // TODO: Replace with real data when available
  const gameLog = [].map((game, index) => ({
    id: `${index}`,
    cells: [
      //   game.date ?? "—-",
      //   game.opponent ?? "—-",
      //   game.min?.toFixed(1) ?? "--",
      //   game.pts?.toFixed(1) ?? "--",
      //   game.reb?.toFixed(1) ?? "--",
      //   game.ast?.toFixed(1) ?? "--",
      //   game.stl?.toFixed(1) ?? "--",
      //   game.blk?.toFixed(1) ?? "--",
      //   game.tov?.toFixed(1) ?? "--",
      //   game.fpts?.toFixed(1) ?? "--",
      "—-",
      "—-",
      "--",
      "--",
      "--",
      "--",
      "--",
      "--",
      "--",
      "--",
    ],
  }));

  return (
    <View className="gap-6">
      <Table
        data={averageStats}
        headers={[
          "STATS",
          "MIN",
          "PTS",
          "REB",
          "AST",
          "STL",
          "BLK",
          "TO",
          "FPTS",
        ]}
        stickyColumns={1}
        widthClasses={[
          "w-32",
          "min-w-12",
          "min-w-12",
          "min-w-12",
          "min-w-12",
          "min-w-12",
          "min-w-12",
          "min-w-12",
          "min-w-12",
        ]}
      />

      <View>
        <View className="flex-row items-center bg-gray-920 px-3 py-3">
          <ListBullets color="white" size={20} />
          <Text className="pbk-b1 pl-2 text-base-white">Game Log</Text>
        </View>
        <Table
          data={
            gameLog.length > 0
              ? gameLog
              : [
                  {
                    id: "empty",
                    cells: [
                      "--",
                      "--",
                      "--",
                      "--",
                      "--",
                      "--",
                      "--",
                      "--",
                      "--",
                    ],
                  },
                ]
          }
          headers={[
            "DATE",
            "OPP",
            "MIN",
            "PTS",
            "REB",
            "AST",
            "STL",
            "BLK",
            "TO",
            "FPTS",
          ]}
          stickyColumns={1}
          widthClasses={[
            "w-20",
            "min-w-12",
            "min-w-12",
            "min-w-12",
            "min-w-12",
            "min-w-12",
            "min-w-12",
            "min-w-12",
            "min-w-12",
            "min-w-12",
          ]}
        />
      </View>
    </View>
  );
};

export default PlayerStats;
