import PlayerSlot from "./PlayerSlot";
import { useAppSelector } from "@/state/hooks";
import { SlotPosition } from "@/types/teamTypes";

type PlayerRosterProps = {
  setSelectedPosition: (position: SlotPosition) => void;
  setShowBottomDrawer: (showBottomDrawer: boolean) => void;
};

const PlayerRoster = ({
  setSelectedPosition,
  setShowBottomDrawer,
}: PlayerRosterProps) => {
  const lineup = useAppSelector((state) => state.team.lineup);

  return (
    <>
      {lineup.map((slot) => (
        <PlayerSlot
          isCard
          key={slot.position}
          openDrawer={() => {
            setSelectedPosition(slot.position);
            setShowBottomDrawer(true);
          }}
          playerData={slot.player}
          position={slot.position}
        />
      ))}
    </>
  );
};

export default PlayerRoster;
