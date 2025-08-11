import { Pressable, View, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import BottomSheet from "./BottomSheet";
import PlayerSlot from "./PlayerSlot";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { swapPlayersInLineup } from "@/state/slices/teamSlice";
import { SlotPosition } from "@/types/teamTypes";
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
    if (!selectedPosition) return false;

    if (slot.position === selectedPosition) return false;

    if (!selectedPlayer) {
      if (!slot.player) return false;

      const playerCanMoveToSelected =
        slot.player.positions.includes(selectedPosition) ||
        selectedPosition.startsWith("BEN") ||
        ["UTIL1", "UTIL2", "UTIL3"].includes(selectedPosition);

      return playerCanMoveToSelected;
    } else {
      const canPlayPosition = selectedPlayer.positions.includes(slot.position);
      const isUtilSlot = ["UTIL1", "UTIL2", "UTIL3"].includes(slot.position);

      return canPlayPosition || isUtilSlot;
    }
  });

  const eligibleBenchSlots = team.bench.filter((benchSlot) => {
    if (!selectedPosition) return false;

    if (benchSlot.position === selectedPosition) return false;

    if (!selectedPlayer) {
      if (!benchSlot.player || selectedPosition.startsWith("BEN")) return false;

      const playerCanMoveToSelected =
        benchSlot.player.positions.includes(selectedPosition) ||
        ["UTIL1", "UTIL2", "UTIL3"].includes(selectedPosition);

      return playerCanMoveToSelected;
    } else {
      return true;
    }
  });

  const hasEligibleOptions =
    eligibleSlots.length > 0 || eligibleBenchSlots.length > 0;

  return (
    <BottomSheet
      footer={
        <Pressable
          className="min-h-12 w-full justify-center rounded-md bg-purple-600"
          onPress={() => {
            setShowBottomDrawer(false);
            setSelectedPosition(null);
          }}
        >
          <Text className="pbk-h6 text-center text-base-white">
            SAVE LINEUP
          </Text>
        </Pressable>
      }
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
                      console.log("Drawer out, this should be a swap.");
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
                          from: selectedPosition,
                          to: benchSlot.position,
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
