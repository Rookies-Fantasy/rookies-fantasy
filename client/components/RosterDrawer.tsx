import { View, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import BottomSheet from "./BottomSheet";
import PlayerSlot from "./PlayerSlot";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { swapPlayersInLineup } from "@/state/slices/teamSlice";
import { FlexPosition, SlotPosition, UTIL_POSITIONS } from "@/types/teamTypes";
import { cn } from "@/utils/jsUtils";

type RosterDrawerProps = {
  selectedPosition: SlotPosition | null;
  setSelectedPosition: (selectedPosition: SlotPosition | null) => void;
  setShowBottomDrawer: (showBottomDrawer: boolean) => void;
  showBottomDrawer: boolean;
};

const RosterDrawer = ({
  selectedPosition,
  setSelectedPosition,
  setShowBottomDrawer,
  showBottomDrawer,
}: RosterDrawerProps) => {
  const team = useAppSelector((state) => state.team);
  const dispatch = useAppDispatch();

  const getSelectedPlayer = () => {
    if (!selectedPosition) return null;

    if (!selectedPosition.startsWith("BEN")) {
      const lineupSlot = team.lineup.find(
        (slot) => slot.position === selectedPosition,
      );
      return lineupSlot?.player || null;
    }

    const benchSlot = team.bench.find(
      (slot) => slot.position === selectedPosition,
    );
    return benchSlot?.player || null;
  };

  const selectedPlayer = getSelectedPlayer();

  const eligibleSlots = team.lineup.filter((slot) => {
    if (!selectedPosition || slot.position === selectedPosition) return false;

    if (!selectedPlayer) {
      if (!slot.player) return false;

      return (
        slot.player.positions.includes(selectedPosition) ||
        selectedPosition.startsWith("BEN") ||
        UTIL_POSITIONS.includes(selectedPosition as FlexPosition)
      );
    }

    return (
      selectedPlayer.positions.includes(slot.position) ||
      UTIL_POSITIONS.includes(slot.position as FlexPosition)
    );
  });

  const eligibleBenchSlots = team.bench.filter((benchSlot) => {
    if (!selectedPosition || benchSlot.position === selectedPosition)
      return false;

    if (!selectedPlayer) {
      if (!benchSlot.player || selectedPosition.startsWith("BEN")) return false;

      return (
        benchSlot.player.positions.includes(selectedPosition) ||
        UTIL_POSITIONS.includes(selectedPosition as FlexPosition)
      );
    }

    return true;
  });

  const hasEligibleOptions =
    eligibleSlots.length > 0 || eligibleBenchSlots.length > 0;

  return (
    <BottomSheet
      header={
        <Text className="pbk-b1 text-center text-base-white">Edit lineup</Text>
      }
      isOpen={showBottomDrawer}
      onClose={() => {
        setShowBottomDrawer(false);
        setSelectedPosition(null);
      }}
      snapPoints={["66%"]}
    >
      <ScrollView
        className="flex-1 border-t-2 border-gray-900"
        contentContainerClassName={cn("pb-20", !hasEligibleOptions && "flex-1")}
        showsVerticalScrollIndicator={false}
      >
        {hasEligibleOptions ? (
          <>
            {eligibleSlots.map((slot) => (
              <View className="border-b-2 border-gray-900" key={slot.position}>
                <PlayerSlot
                  isSelected={selectedPosition === slot.position}
                  onPlayerRemove={() => {
                    if (selectedPosition === slot.position) {
                      setSelectedPosition(null);
                    }
                  }}
                  openDrawer={() => {
                    if (
                      showBottomDrawer &&
                      slot.position !== selectedPosition &&
                      selectedPosition !== null
                    ) {
                      dispatch(
                        swapPlayersInLineup({
                          from: selectedPosition,
                          to: slot.position,
                        }),
                      );
                      setShowBottomDrawer(false);
                    } else {
                      setSelectedPosition(slot.position);
                      setShowBottomDrawer(true);
                    }
                  }}
                  playerData={slot.player}
                  position={slot.position}
                />
              </View>
            ))}
            {eligibleBenchSlots.map((benchSlot) => (
              <View
                className="border-b-2 border-gray-900"
                key={benchSlot.position}
              >
                <PlayerSlot
                  isSelected={selectedPosition === benchSlot.position}
                  onPlayerRemove={() => {
                    if (selectedPosition === benchSlot.position) {
                      setSelectedPosition(null);
                    }
                  }}
                  openDrawer={() => {
                    if (
                      showBottomDrawer &&
                      benchSlot.position !== selectedPosition &&
                      selectedPosition !== null
                    ) {
                      dispatch(
                        swapPlayersInLineup({
                          from: benchSlot.position,
                          to: selectedPosition,
                        }),
                      );
                      setShowBottomDrawer(false);
                    } else {
                      setSelectedPosition(benchSlot.position);
                      setShowBottomDrawer(true);
                    }
                  }}
                  playerData={benchSlot.player}
                  position={benchSlot.position}
                />
              </View>
            ))}
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="pbk-b2 text-center text-gray-300">
              No eligible positions for this player.
            </Text>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
};

export default RosterDrawer;
