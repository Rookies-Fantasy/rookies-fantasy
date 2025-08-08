import PlayerSlot from "./PlayerSlot";
import { LineupSlot, SlotPosition } from "@/types/teamTypes";

type PlayerRosterProps = {
  enableActionIcon?: boolean;
  isCard?: boolean;
  lineup: LineupSlot[];
  selectedPosition: SlotPosition | null;
  setSelectedPosition: (position: SlotPosition | null) => void;
  setShowBottomDrawer: (showBottomDrawer: boolean) => void;
  showBottomDrawer: boolean;
};

const PlayerRoster = ({
  enableActionIcon = false,
  isCard = false,
  lineup,
  selectedPosition,
  setSelectedPosition,
  setShowBottomDrawer,
  showBottomDrawer,
}: PlayerRosterProps) => (
  <>
    {lineup.map((slot) => (
      <PlayerSlot
        enableActionIcon={enableActionIcon}
        isCard={isCard}
        key={slot.position}
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
    ))}
  </>
);

export default PlayerRoster;
