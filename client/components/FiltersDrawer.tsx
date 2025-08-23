import { Image } from "expo-image";
import { Check } from "phosphor-react-native";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Accordion from "./Accordion";
import BottomSheet from "./BottomSheet";
import RangeSlider from "./RangeSlider";
import { Filters, PositionOption } from "@/app/(protected)/(draft)/players";
import { NbaTeam } from "@/types/nbaTeams";
import { cn } from "@/utils/jsUtils";

type FilterDrawerProps = {
  teams: NbaTeam[];
  showFiltersDrawer: boolean;
  setShowFiltersDrawer: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
};

const FiltersDrawer = ({
  teams,
  showFiltersDrawer,
  setShowFiltersDrawer,
  filters,
  setFilters,
}: FilterDrawerProps) => {
  const handleTeamPress = (team: NbaTeam) => {
    const isSelected = filters.selectedTeams.some(
      (selectedTeam) => selectedTeam.id === team.id,
    );

    if (isSelected) {
      setFilters({
        ...filters,
        selectedTeams: filters.selectedTeams.filter(
          (selectedTeam) => selectedTeam.id !== team.id,
        ),
      });
    } else {
      setFilters({
        ...filters,
        selectedTeams: [...filters.selectedTeams, team],
      });
    }
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
    const isSelected = filters.selectedPositions.includes(position);

    if (isSelected) {
      setFilters({
        ...filters,
        selectedPositions: filters.selectedPositions.filter(
          (p) => p !== position,
        ),
      });
    } else {
      setFilters({
        ...filters,
        selectedPositions: [...filters.selectedPositions, position],
      });
    }
  };

  const isPositionSelected = (position: PositionOption) =>
    filters.selectedPositions.includes(position);

  const handleSalaryChange = (minValue: number, maxValue: number) => {
    setFilters({
      ...filters,
      salaryRange: { min: minValue, max: maxValue },
    });
  };

  const formatSalaryValue = (value: number) =>
    `$${(value / 1000000).toFixed(0)}M`;

  return (
    <BottomSheet
      footer={
        <Pressable
          className="min-h-12 w-full justify-center rounded-md bg-purple-600"
          onPress={() => {}}
        >
          <Text className="pbk-h6 text-center text-base-white">
            SAVE LINEUP
          </Text>
        </Pressable>
      }
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
        <View className="flex-row justify-center">
          <RangeSlider
            formatValue={formatSalaryValue}
            initialMaxValue={filters.salaryRange.max}
            initialMinValue={filters.salaryRange.min}
            max={150000000}
            min={1000000}
            onValueChange={handleSalaryChange}
            step={1000000}
          />
        </View>
      </Accordion>
    </BottomSheet>
  );
};

export default FiltersDrawer;
