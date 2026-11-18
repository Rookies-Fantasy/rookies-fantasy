import type { TeamLineupSlot } from "../../../client/types/team.js";
import type { NbaPlayerFixture } from "../fixtures/nbaPlayers.js";

const lineupPositions = [
  "PG",
  "SG",
  "SF",
  "PF",
  "C",
  "UTIL1",
  "UTIL2",
  "UTIL3",
] as const;

const toTeamPlayer = (player: NbaPlayerFixture) => ({
  id: player.playerId,
  firstName: player.firstName,
  lastName: player.lastName,
  positions: player.positions,
  salary: player.salary,
  headshotUrl: player.headshotUrl,
  teamAbbreviation: player.teamAbbreviation,
});

export const buildLineup = (
  players: readonly NbaPlayerFixture[],
  offset = 0,
): TeamLineupSlot[] => {
  const rotatedPlayers = [
    ...players.slice(offset),
    ...players.slice(0, offset),
  ];
  const selected = new Set<string>();

  return lineupPositions.map((position) => {
    const player = rotatedPlayers.find(
      (candidate) =>
        !selected.has(candidate.playerId) &&
        (position.startsWith("UTIL") || candidate.positions.includes(position)),
    );

    if (!player) {
      throw new Error(`Unable to seed a player for the ${position} position.`);
    }

    selected.add(player.playerId);
    return { position, player: toTeamPlayer(player) };
  });
};

export const getLineupSalary = (lineup: readonly TeamLineupSlot[]): number =>
  lineup.reduce((total, slot) => total + (slot.player?.salary ?? 0), 0);
