import PlayerSlot from "./PlayerSlot";
import { BenchSlot, LineupSlot, SlotPosition } from "@/types/teamTypes";

type PlayerRosterProps = {
  bench: BenchSlot[];
  enableActionIcon?: boolean;
  isCard?: boolean;
  lineup: LineupSlot[];
  selectedPosition: SlotPosition | null;
  setSelectedPosition: (position: SlotPosition | null) => void;
  setShowBottomDrawer: () => void;
  setShowFloatingButton?: () => void;
  showBottomDrawer: boolean;
};

const PlayerRoster = ({
  bench,
  enableActionIcon = false,
  isCard = false,
  lineup,
  selectedPosition,
  setSelectedPosition,
  setShowBottomDrawer,
  setShowFloatingButton,
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
            setShowBottomDrawer();
          }
        }}
        playerData={slot.player}
        position={slot.position}
        setShowFloatingButton={setShowFloatingButton}
      />
    ))}
    {bench.length > 0 &&
      bench.map((benchSlot) => (
        <PlayerSlot
          enableActionIcon={enableActionIcon}
          isCard={isCard}
          key={benchSlot.position}
          openDrawer={() => {
            if (showBottomDrawer && benchSlot.position !== selectedPosition) {
              console.log("Drawer out, this should be a swap from bench.");
            } else {
              setSelectedPosition(benchSlot.position);
              setShowBottomDrawer();
            }
          }}
          playerData={benchSlot.player}
          position={benchSlot.position}
          setShowFloatingButton={setShowFloatingButton}
        />
      ))}
  </>
);

export default PlayerRoster;
