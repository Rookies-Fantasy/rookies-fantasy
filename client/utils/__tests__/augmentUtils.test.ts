import { describe, expect, it } from "@jest/globals";
import { toLineupPlayer, toLineupSlots } from "@/controllers/lineupMapper";
import { Augment } from "@/types/augment";
import { defaultAverageStats, defaultPlayer, Player } from "@/types/player";
import { PlayerTeamDisplay, TeamLineupSlot } from "@/types/team";
import { validateAugment } from "@/utils/augmentUtils";

const reboundAugment: Augment = {
  id: "glass-cleaner",
  title: "Glass Cleaner",
  description: "Boost rebounds",
  info: "",
  iconUrl: "",
  isActive: true,
  playerCount: 1,
  prerequisites: [
    {
      type: "statThreshold",
      description: "1 player averaging 5+ rebounds",
      condition: { count: 1, stat: "rebounds", operator: ">=", value: 5 },
    },
  ],
  effects: [{ statBoosts: [{ stat: "rebounds", multiplier: 1.5 }] }],
};

const centerAugment: Augment = {
  ...reboundAugment,
  id: "big-man",
  prerequisites: [
    {
      type: "positionRequirement",
      description: "1 center",
      condition: { count: 1, position: ["C"] },
    },
  ],
};

const noMinutesAugment: Augment = {
  ...reboundAugment,
  id: "rested",
  prerequisites: [
    {
      type: "statThreshold",
      description: "1 player averaging exactly 0 minutes",
      condition: { count: 1, stat: "minutes", operator: "=", value: 0 },
    },
  ],
};

// A lineup player as stored in Firestore, with no averageStats field
const rawPlayerWithoutStats = {
  id: "no-stats",
  firstName: "Deep",
  lastName: "Bench",
  headshotUrl: "",
  positions: ["C"],
  salary: 1000000,
  teamAbbreviation: "BKN",
};

const playerWithoutStats: PlayerTeamDisplay = toLineupPlayer(
  rawPlayerWithoutStats,
);

const rebounder: Player = {
  ...defaultPlayer,
  id: "rebounder",
  positions: ["PF"],
  averageStats: { ...defaultAverageStats, rebounds: 10 },
};

describe("validateAugment", () => {
  it("does not crash when a lineup player has no averageStats", () => {
    const lineup: TeamLineupSlot[] = [
      { position: "C", player: playerWithoutStats },
    ];

    expect(() => validateAugment(reboundAugment, lineup)).not.toThrow();
  });

  it("treats missing averageStats as zeros", () => {
    const lineup: TeamLineupSlot[] = [
      { position: "C", player: playerWithoutStats },
      { position: "PF", player: rebounder },
    ];

    const result = validateAugment(reboundAugment, lineup);

    expect(result.isValid).toBe(true);
    expect(result.qualifyingPlayers.map((player) => player.id)).toEqual([
      "rebounder",
    ]);
  });

  it("is invalid when the only player lacks averageStats", () => {
    const result = validateAugment(reboundAugment, [
      { position: "C", player: playerWithoutStats },
    ]);

    expect(result.isValid).toBe(false);
    expect(result.qualifyingPlayers).toEqual([]);
  });

  it("reads an explicit null stat as 0, so `=` conditions still match", () => {
    const lineup = toLineupSlots([
      {
        position: "C",
        player: {
          ...rawPlayerWithoutStats,
          averageStats: { ...defaultAverageStats, minutes: null },
        },
      },
    ]);

    const result = validateAugment(noMinutesAugment, lineup);

    expect(result.isValid).toBe(true);
    expect(result.qualifyingPlayers.map((player) => player.id)).toEqual([
      "no-stats",
    ]);
  });

  it("does not crash stat augments for a legacy player without positions", () => {
    const { positions: _positions, ...rawLegacyPlayer } = {
      ...rawPlayerWithoutStats,
      averageStats: { ...defaultAverageStats, rebounds: 8 },
    };
    const lineup = toLineupSlots([{ position: "C", player: rawLegacyPlayer }]);

    expect(() => validateAugment(reboundAugment, lineup)).not.toThrow();
    expect(validateAugment(reboundAugment, lineup).isValid).toBe(true);
    expect(validateAugment(centerAugment, lineup).isValid).toBe(false);
  });

  it("matches position requirements against a player's own positions", () => {
    const result = validateAugment(centerAugment, [
      { position: "C", player: playerWithoutStats },
      { position: "PF", player: rebounder },
    ]);

    expect(result.isValid).toBe(true);
    expect(result.qualifyingPlayers.map((player) => player.id)).toEqual([
      "no-stats",
    ]);
  });

  it("counts players placed in UTIL slots", () => {
    const result = validateAugment(reboundAugment, [
      { position: "PF", player: null },
      { position: "UTIL1", player: rebounder },
    ]);

    expect(result.isValid).toBe(true);
    expect(result.qualifyingPlayers.map((player) => player.id)).toEqual([
      "rebounder",
    ]);
  });

  it("counts UTIL-slot players for position requirements by their own positions", () => {
    const result = validateAugment(centerAugment, [
      { position: "UTIL2", player: playerWithoutStats },
    ]);

    expect(result.isValid).toBe(true);
  });
});
