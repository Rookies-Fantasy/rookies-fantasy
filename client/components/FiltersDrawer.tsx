import { Image } from "expo-image";
import { Check } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Accordion from "./Accordion";
import BottomSheet from "./BottomSheet";
import FloatingActionButton from "./FloatingActionButton";
import RangeSlider from "./RangeSlider";
import Spinner from "./Spinner";
import {
  Filters,
  PositionOption,
} from "@/app/(protected)/(draft)/(teamBuilder)/players";
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
  const [isApplyLoading, setIsApplyLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  useEffect(() => {
    if (showFiltersDrawer) {
      setLocalFilters(filters);
    }
  }, [showFiltersDrawer, filters]);

  const handleTeamPress = (team: NbaTeam) => {
    const isSelected = localFilters.selectedTeams.some(
      (selectedTeam) => selectedTeam.id === team.id,
    );

    if (isSelected) {
      setLocalFilters({
        ...localFilters,
        selectedTeams: localFilters.selectedTeams.filter(
          (selectedTeam) => selectedTeam.id !== team.id,
        ),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        selectedTeams: [...localFilters.selectedTeams, team],
      });
    }
  };

  const isTeamSelected = (team: NbaTeam) =>
    localFilters.selectedTeams.some(
      (selectedTeam) => selectedTeam.id === team.id,
    );

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
    const isSelected = localFilters.selectedPositions.includes(position);

    if (isSelected) {
      setLocalFilters({
        ...localFilters,
        selectedPositions: localFilters.selectedPositions.filter(
          (p) => p !== position,
        ),
      });
    } else {
      setLocalFilters({
        ...localFilters,
        selectedPositions: [...localFilters.selectedPositions, position],
      });
    }
  };

  const isPositionSelected = (position: PositionOption) =>
    localFilters.selectedPositions.includes(position);

  const handleSalaryChange = (minValue: number, maxValue: number) => {
    setLocalFilters({
      ...localFilters,
      salaryRange: { min: minValue, max: maxValue },
    });
  };

  const formatSalaryValue = (value: number) =>
    `$${(value / 1000000).toFixed(0)}M`;

  const handleApply = () => {
    try {
      setIsApplyLoading(true);
      setFilters(localFilters);
      setShowFiltersDrawer();
    } catch (error) {
      console.log(error);
    } finally {
      setIsApplyLoading(false);
    }
  };

  const handleReset = () => {
    try {
      setIsResetLoading(true);
      const resetFilters: Filters = {
        selectedTeams: [],
        selectedPositions: [],
        salaryRange: { min: 1000000, max: 150000000 },
      };
      setLocalFilters(resetFilters);
      setFilters(resetFilters);
      setShowFiltersDrawer();
    } catch (error) {
      console.log(error);
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <BottomSheet
      footer={
        <View className="absolute left-6 right-6 flex-row gap-4">
          <FloatingActionButton
            absolute={false}
            buttonBackground="bg-gray-900 border border-gray-800"
            className="flex-1"
            onPress={handleReset}
          >
            {isResetLoading ? (
              <View className="items-center justify-center">
                <Spinner />
              </View>
            ) : (
              <Text className="pbk-h6 text-center text-base-white">RESET</Text>
            )}
          </FloatingActionButton>

          <FloatingActionButton
            absolute={false}
            buttonBackground="bg-purple-500"
            className="flex-1"
            onPress={handleApply}
          >
            {isApplyLoading ? (
              <View className="items-center justify-center">
                <Spinner />
              </View>
            ) : (
              <Text className="pbk-h6 text-center text-base-white">APPLY</Text>
            )}
          </FloatingActionButton>
        </View>
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
        <View className="ml-4 flex-row flex-wrap items-center justify-center gap-x-7">
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
            max={150000000}
            min={1000000}
            onChange={([min, max]) => handleSalaryChange(min, max)}
            step={1000000}
            value={[localFilters.salaryRange.min, localFilters.salaryRange.max]}
          />
        </View>
      </Accordion>
    </BottomSheet>
  );
};

export default FiltersDrawer;
