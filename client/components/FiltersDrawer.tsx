import { Image } from "expo-image";
import { Check } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Accordion from "./Accordion";
import BottomSheet from "./BottomSheet";
import { NbaTeam } from "@/types/nbaTeams";
import { Position } from "@/types/teamTypes";
import { cn } from "@/utils/jsUtils";

type FilterDrawerProps = {
  teams: NbaTeam[];
  showFiltersDrawer: boolean;
  setShowFiltersDrawer: () => void;
};

type PositionOption = Position | "ALL" | "G" | "F";

type Filters = {
  selectedTeams: NbaTeam[];
  selectedPositions: PositionOption[];
  salaryRange: { min: number; max: number };
};

const FiltersDrawer = ({
  teams,
  showFiltersDrawer,
  setShowFiltersDrawer,
}: FilterDrawerProps) => {
  const [filters, setFilters] = useState<Filters>({
    selectedTeams: [],
    selectedPositions: [],
    salaryRange: { min: 0, max: 75000000 },
  });

  const handleTeamPress = (team: NbaTeam) => {
    setFilters((prev) => {
      const isSelected = prev.selectedTeams.some(
        (selectedTeam) => selectedTeam.id === team.id,
      );

      if (isSelected) {
        return {
          ...prev,
          selectedTeams: prev.selectedTeams.filter(
            (selectedTeam) => selectedTeam.id !== team.id,
          ),
        };
      } else {
        return {
          ...prev,
          selectedTeams: [...prev.selectedTeams, team],
        };
      }
    });
  };

  useEffect(() => {
    console.log(filters);
  }, [filters]);

  const isTeamSelected = (team: NbaTeam) =>
    filters.selectedTeams.some((selectedTeam) => selectedTeam.id === team.id);

  const positionOptions: PositionOption[] = [
    "ALL",
    "PG",
    "SG",
    "SF",
    "PF",
    "C",
    "G",
    "F",
  ];

  const handlePositionPress = (position: PositionOption) => {
    setFilters((prev) => {
      const isSelected = prev.selectedPositions.includes(position);

      if (isSelected) {
        return {
          ...prev,
          selectedPositions: prev.selectedPositions.filter(
            (p) => p !== position,
          ),
        };
      } else {
        return {
          ...prev,
          selectedPositions: [...prev.selectedPositions, position],
        };
      }
    });
  };

  const isPositionSelected = (position: PositionOption) =>
    filters.selectedPositions.includes(position);

  return (
    <BottomSheet
      header={
        <Text className="pbk-b1 text-center text-base-white">
          Filter players
        </Text>
      }
      isOpen={showFiltersDrawer}
      onClose={setShowFiltersDrawer}
      snapPoints={["90%"]}
    >
      <Accordion title="Team">
        <View className="flex-row flex-wrap justify-center gap-x-8">
          {teams.map((team) => (
            <View className="w-1/4" key={team.id}>
              <Pressable
                className={cn(
                  "my-3 flex-row items-center justify-between rounded-md px-2 py-3",
                  isTeamSelected(team) && "bg-gray-800",
                )}
                onPress={() => handleTeamPress(team)}
              >
                <View className="flex-row items-center gap-1">
                  <Image
                    contentFit="contain"
                    source={{ uri: team.logoUrl }}
                    style={{ width: 32, height: 32 }}
                  />
                  <Text className="pbk-b2 text-center text-base-white">
                    {team.abbreviation}
                  </Text>
                </View>
                {isTeamSelected(team) && <Check color="#A4A7AE" size={20} />}
              </Pressable>
            </View>
          ))}
        </View>
      </Accordion>
      <Accordion title="Position">
        <View className="flex-row flex-wrap items-center justify-center gap-x-2">
          {positionOptions.map((position) => (
            <View className="w-1/5" key={position}>
              <Pressable
                className={cn(
                  "my-3 flex-row items-center justify-between rounded-md px-3 py-3",
                  isPositionSelected(position) && "bg-gray-800",
                )}
                onPress={() => handlePositionPress(position)}
              >
                <Text className="pbk-b2 text-center text-base-white">
                  {position}
                </Text>
                <View className="h-5 w-5 items-center justify-center">
                  {isPositionSelected(position) && (
                    <Check color="#A4A7AE" size={20} />
                  )}
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </Accordion>
      <Accordion title="Salary">
        <Text>Test</Text>
      </Accordion>
    </BottomSheet>
  );
};

export default FiltersDrawer;
