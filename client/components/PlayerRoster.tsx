import PlayerSlot from "./PlayerSlot";
import { BenchSlot, LineupSlot, SlotPosition } from "@/types/teamTypes";

type PlayerRosterProps = {
  bench: BenchSlot[];
  enableActionIcon?: boolean;
  isCard?: boolean;
  lineup: LineupSlot[];
  setSelectedPosition: (position: SlotPosition | null) => void;
  setShowBottomDrawer: () => void;
  setShowFloatingButton?: () => void;
};

const PlayerRoster = ({
  bench,
  enableActionIcon = false,
  isCard = false,
  lineup,
  setSelectedPosition,
  setShowBottomDrawer,
  setShowFloatingButton,
}: PlayerRosterProps) => (
  <>
    {lineup.map((slot) => (
      <PlayerSlot
        enableActionIcon={enableActionIcon}
        isCard={isCard}
        key={slot.position}
        openDrawer={() => {
          setSelectedPosition(slot.position);
          setShowBottomDrawer();
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
            setSelectedPosition(benchSlot.position);
            setShowBottomDrawer();
          }}
          playerData={benchSlot.player}
          position={benchSlot.position}
          setShowFloatingButton={setShowFloatingButton}
        />
      ))}
  </>
);

export default PlayerRoster;
