import { describe, expect, it } from "@jest/globals";
import {
  toBenchSlots,
  toLineupPlayer,
  toLineupSlots,
} from "@/controllers/lineupMapper";
import { defaultAverageStats } from "@/types/player";
import { defaultTeam } from "@/types/team";

// What the team builder has historically saved: the full NBA player object
const savedPlayer = {
  id: "123",
  firstName: "Nikola",
  lastName: "Jokic",
  headshotUrl: "https://example.com/headshot.png",
  positions: ["C"],
  salary: 50000000,
  teamAbbreviation: "DEN",
  teamId: "8",
  gamesPlayed: 70,
  averageStats: { ...defaultAverageStats, rebounds: 12, minutes: 35 },
};

describe("toLineupPlayer", () => {
  it("maps a saved lineup player to the typed lineup shape", () => {
    expect(toLineupPlayer(savedPlayer)).toEqual({
      id: "123",
      firstName: "Nikola",
      lastName: "Jokic",
      headshotUrl: "https://example.com/headshot.png",
      positions: ["C"],
      salary: 50000000,
      teamAbbreviation: "DEN",
      averageStats: { ...defaultAverageStats, rebounds: 12, minutes: 35 },
    });
  });

  it("fills missing averageStats with zeros", () => {
    const { averageStats: _averageStats, ...withoutStats } = savedPlayer;

    expect(toLineupPlayer(withoutStats).averageStats).toEqual(
      defaultAverageStats,
    );
  });

  it("reads null stats as 0", () => {
    const player = toLineupPlayer({
      ...savedPlayer,
      averageStats: { ...savedPlayer.averageStats, minutes: null },
    });

    expect(player.averageStats.minutes).toBe(0);
    expect(player.averageStats.rebounds).toBe(12);

    expect(
      toLineupPlayer({ ...savedPlayer, averageStats: null }).averageStats,
    ).toEqual(defaultAverageStats);
  });

  it("falls back to no positions for a legacy player without positions", () => {
    const { positions: _positions, ...legacyPlayer } = savedPlayer;

    expect(toLineupPlayer(legacyPlayer).positions).toEqual([]);
  });
});

describe("toLineupSlots / toBenchSlots", () => {
  it("maps every slot, keeping empty slots empty", () => {
    const lineup = toLineupSlots([
      { position: "C", player: savedPlayer },
      { position: "UTIL1", player: null },
    ]);

    expect(lineup).toEqual([
      { position: "C", player: toLineupPlayer(savedPlayer) },
      { position: "UTIL1", player: null },
    ]);
  });

  it("maps bench players too", () => {
    const { averageStats: _averageStats, ...withoutStats } = savedPlayer;
    const bench = toBenchSlots([{ position: "BEN1", player: withoutStats }]);

    expect(bench[0].player.averageStats).toEqual(defaultAverageStats);
  });

  it("uses the team defaults when the field is missing", () => {
    expect(toLineupSlots(undefined)).toEqual(defaultTeam.lineup);
    expect(toBenchSlots(undefined)).toEqual(defaultTeam.bench);
  });
});
