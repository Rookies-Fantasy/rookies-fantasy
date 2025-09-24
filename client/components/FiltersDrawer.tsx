import { Image } from "expo-image";
import { Check } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Accordion from "./Accordion";
import BottomSheet from "./BottomSheet";
import Button from "./Button";
import RangeSlider from "./RangeSlider";
import { NbaTeam } from "@/types/nbaTeams";
import { PlayerFilters } from "@/types/players";
import { POSITION_OPTIONS, PositionFilters } from "@/types/team";
import { cn } from "@/utils/jsUtils";

type FilterDrawerProps = {
  teams: NbaTeam[];
  showFiltersDrawer: boolean;
  setShowFiltersDrawer: () => void;
  filters: PlayerFilters;
  setFilters: (filters: PlayerFilters) => void;
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
  const [localFilters, setLocalFilters] = useState<PlayerFilters>(filters);

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

  const handlePositionPress = (position: PositionFilters) => {
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

  const isPositionSelected = (position: PositionFilters) =>
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
      const resetFilters: PlayerFilters = {
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
        <View className="flex-row gap-4">
          <Button
            className="flex-1"
            isLoading={isResetLoading}
            label="RESET"
            onPress={handleReset}
            variant="secondary"
          />

          <Button
            className="flex-1"
            isLoading={isApplyLoading}
            label="APPLY"
            onPress={handleApply}
          />
        </View>
      }
      header={
        <Text className="pbk-b1 text-center text-base-white">
          Filter players
        </Text>
      }
      isOpen={showFiltersDrawer}
      onClose={setShowFiltersDrawer}
      snapPoints={["80%"]}
    >
      <Accordion selectedCount={localFilters.selectedTeams.length} title="Team">
        <ScrollView contentContainerClassName="flex-row flex-wrap justify-center gap-x-8 pb-36">
          {teams.map((team) => (
            <View key={team.id}>
              <Pressable
                className={cn(
                  "my-3 flex-row items-center justify-between rounded-md px-2 py-3",
                  isTeamSelected(team) && "bg-gray-800",
                )}
                onPress={() => handleTeamPress(team)}
              >
                <View className="flex-row items-center gap-2">
                  <Image
                    contentFit="contain"
                    source={{ uri: team.logoUrl }}
                    style={{ width: 32, height: 32 }}
                  />
                  <Text className="pbk-b2 text-center text-base-white">
                    {team.abbreviation}
                  </Text>
                  <View className="h-5 w-5 items-center justify-center">
                    {isTeamSelected(team) && (
                      <Check color="#A4A7AE" size={20} />
                    )}
                  </View>
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </Accordion>
      <Accordion
        selectedCount={localFilters.selectedPositions.length}
        title="Position"
      >
        <View className="ml-4 flex-row flex-wrap items-center justify-center gap-x-7">
          {POSITION_OPTIONS.map((position) => (
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
      <Accordion
        selectedCount={
          localFilters.salaryRange.min !== 1000000 ||
          localFilters.salaryRange.max !== 150000000
            ? 1
            : 0
        }
        title="Salary"
      >
        <View className="flex-row justify-center">
          <RangeSlider
            formatValue={formatSalaryValue}
            onChange={([min, max]) => handleSalaryChange(min, max)}
            value={[localFilters.salaryRange.min, localFilters.salaryRange.max]}
          />
        </View>
      </Accordion>
    </BottomSheet>
  );
};

export default FiltersDrawer;
