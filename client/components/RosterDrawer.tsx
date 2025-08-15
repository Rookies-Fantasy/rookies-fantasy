import { Pressable, View, Text } from "react-native";
import BottomSheet from "./BottomSheet";
import PlayerSlot from "./PlayerSlot";
import { useAppSelector } from "@/state/hooks";
import { selectEligibleSlotsForPosition } from "@/state/slices/teamSlice";
import { SlotPosition } from "@/types/teamTypes";

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
  const eligibleSlots = useAppSelector((state) =>
    selectedPosition
      ? selectEligibleSlotsForPosition(state, selectedPosition)
      : [],
  );

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
      <View className="flex-1 border-t-2 border-gray-900">
        {eligibleSlots.length > 0 ? (
          eligibleSlots.map((slot) => (
            <View className="border-b-2 border-gray-900" key={slot.position}>
              <PlayerSlot
                isSelected={selectedPosition === slot.position}
                onPlayerRemove={() => {
                  if (selectedPosition === slot.position) {
                    setSelectedPosition(null);
                  }
                }}
                openDrawer={() => {
                  if (showBottomDrawer && slot.position !== selectedPosition) {
                    // TODO: Complete swap functionality here. This if statement checks if the drawer is already open, and also ensures
                    // that if a user clicks on the initial selected position it does not complete the "swap"
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
          ))
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="pbk-b2 text-center text-gray-300">
              No eligible players for this position.
            </Text>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

export default RosterDrawer;
