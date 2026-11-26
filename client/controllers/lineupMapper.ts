import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import {
  BenchSlot,
  defaultTeam,
  PlayerTeamDisplay,
  TeamLineupSlot,
} from "@/types/team";
import { isNotNil } from "@/utils/jsUtils";
import { toPlayerAverageStats } from "@/utils/playerUtils";

type RawFirestoreData = FirebaseFirestoreTypes.DocumentData;

// Saved lineups are raw Firestore data. Older saves may be missing fields
// (e.g. averageStats for players with no games, or positions on legacy
// players), so every field gets a typed fallback here at the boundary.
export const toLineupPlayer = (
  player: RawFirestoreData,
): PlayerTeamDisplay => ({
  averageStats: toPlayerAverageStats(player.averageStats),
  firstName: player.firstName ?? "",
  headshotUrl: player.headshotUrl ?? player.headshotURL ?? "",
  id: String(player.id ?? ""),
  lastName: player.lastName ?? "",
  positions: Array.isArray(player.positions) ? player.positions : [],
  salary: player.salary ?? 0,
  teamAbbreviation: player.teamAbbreviation ?? "",
});

// `null`/`undefined` are accepted on purpose: the lineup or bench field can be
// absent from the team document, in which case the team defaults are used.
export const toLineupSlots = (
  lineup: RawFirestoreData[] | null | undefined,
): TeamLineupSlot[] =>
  Array.isArray(lineup)
    ? lineup.map((slot) => ({
        position: slot.position,
        player: isNotNil(slot.player) ? toLineupPlayer(slot.player) : null,
      }))
    : defaultTeam.lineup;

export const toBenchSlots = (
  bench: RawFirestoreData[] | null | undefined,
): BenchSlot[] =>
  Array.isArray(bench)
    ? bench
        .filter((slot) => isNotNil(slot.player))
        .map((slot) => ({
          position: slot.position,
          player: toLineupPlayer(slot.player),
        }))
    : defaultTeam.bench;
