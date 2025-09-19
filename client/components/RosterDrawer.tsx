import { View, Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import BottomSheet from "./BottomSheet";
import PlayerSlot from "./PlayerSlot";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { swapPlayersInLineup } from "@/state/slices/teamSlice";
import { SlotPosition, Team } from "@/types/team";
import { cn, isNil } from "@/utils/jsUtils";
import {
  findSlotFromPosition,
  isPlayerEligibleForPosition,
} from "@/utils/teamUtils";

type RosterDrawerProps = {
  selectedPosition: SlotPosition;
  setSelectedPosition: (selectedPosition: SlotPosition | null) => void;
  setShowBottomDrawer: (showBottomDrawer: boolean) => void;
  showBottomDrawer: boolean;
};

const getSelectedPlayer = (selectedPosition: SlotPosition, team: Team) => {
  if (selectedPosition.startsWith("BEN")) {
    const benchSlot = findSlotFromPosition(team.bench, selectedPosition);
    return benchSlot?.player ?? null;
  }

  const lineupSlot = findSlotFromPosition(team.lineup, selectedPosition);
  return lineupSlot?.player ?? null;
};

const RosterDrawer = ({
  selectedPosition,
  setSelectedPosition,
  setShowBottomDrawer,
  showBottomDrawer,
}: RosterDrawerProps) => {
  const team = useAppSelector((state) => state.team);
  const dispatch = useAppDispatch();

  const eligibleSlots = team.lineup.filter((slot) => {
    const selectedPlayer = getSelectedPlayer(selectedPosition, team);
    const selectedSlotIsEmpty = isNil(selectedPlayer);

    if (selectedSlotIsEmpty) {
      if (isNil(slot.player)) {
        return false;
      }
      return isPlayerEligibleForPosition(slot.player, selectedPosition);
    }

    return isPlayerEligibleForPosition(selectedPlayer, slot.position);
  });

  const hasEligibleOptions = eligibleSlots.length > 0;

  const onClose = () => {
    setShowBottomDrawer(false);
    setSelectedPosition(null);
  };

  return (
    <BottomSheet
      header={
        <Text className="pbk-b1 text-center text-base-white">Edit lineup</Text>
      }
      isOpen={showBottomDrawer}
      onClose={onClose}
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
            {team.bench.map((benchSlot) => (
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
              No eligible players for this position.
            </Text>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
};

export default RosterDrawer;
