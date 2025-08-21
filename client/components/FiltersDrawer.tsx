import { Pressable, Text, View } from "react-native";
import Accordion from "./Accordion";
import BottomSheet from "./BottomSheet";
import { NbaTeam } from "@/types/nbaTeams";

type FilterDrawerProps = {
  teams: NbaTeam[];
  showFiltersDrawer: boolean;
  setShowFiltersDrawer: () => void;
};

const FiltersDrawer = ({
  teams,
  showFiltersDrawer,
  setShowFiltersDrawer,
}: FilterDrawerProps) => {
  const test = 2;

  return (
    <BottomSheet
      header={
        <Text className="pbk-b1 text-center text-base-white">
          Filter players {test}
        </Text>
      }
      isOpen={showFiltersDrawer}
      onClose={setShowFiltersDrawer}
      snapPoints={["90%"]}
    >
      <Accordion title="Team">
        <View className="flex-row flex-wrap">
          {teams.map((team) => (
            <Pressable
              className="w-1/3 flex-1 flex-row items-center gap-2 p-2"
              key={team.id}
              onPress={() => {}}
            >
              {/* <Image
                contentFit="contain"
                source={{ uri: team.logoUrl }}
                style={{ width: 32, height: 32 }}
              /> */}
              <Text className="pbk-b2 text-center text-base-white">
                {team.abbreviation}
              </Text>
            </Pressable>
          ))}
        </View>
        {/* <Text className="pbk-b2 mb-2 text-base-white">
          Teams count: {teams.length}
        </Text>
        <View className="flex-row flex-wrap">
          {teams.map((team) => (
            <Text className="pbk-b2 p-2 text-base-white" key={team.id}>
              {team.abbreviation}
            </Text>
          ))}
        </View> */}
      </Accordion>
      <Accordion title="Position">
        <Text>Test</Text>
      </Accordion>
      <Accordion title="Salary">
        <Text>Test</Text>
      </Accordion>
    </BottomSheet>
  );
};

export default FiltersDrawer;
