import PlayerSlot from "./PlayerSlot";
import { BenchSlot, LineupSlot, SlotPosition } from "@/types/team";

type PlayerRosterProps = {
  bench: BenchSlot[];
  isCard?: boolean;
  lineup: LineupSlot[];
  setSelectedPosition: (position: SlotPosition | null) => void;
  onOpen: () => void;
};

const PlayerRoster = ({
  bench,
  isCard = false,
  lineup,
  setSelectedPosition,
  onOpen,
}: PlayerRosterProps) => (
  <>
    {lineup.map((slot) => (
      <PlayerSlot
        isCard={isCard}
        key={slot.position}
        openDrawer={() => {
          setSelectedPosition(slot.position);
          onOpen();
        }}
        playerData={slot.player}
        position={slot.position}
      />
    ))}
    {bench.length > 0 &&
      bench.map((benchSlot) => (
        <PlayerSlot
          isCard={isCard}
          key={benchSlot.position}
          openDrawer={() => {
            setSelectedPosition(benchSlot.position);
            onOpen();
          }}
          playerData={benchSlot.player}
          position={benchSlot.position}
        />
      ))}
  </>
);

export default PlayerRoster;
