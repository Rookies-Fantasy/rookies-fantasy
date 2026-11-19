import { describe, expect, it } from "@jest/globals";
import { Augment } from "@/types/augment";
import { defaultPlayer, Player } from "@/types/player";
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

// A lineup player as stored in Firestore, with no averageStats field
const playerWithoutStats: PlayerTeamDisplay = {
  id: "no-stats",
  firstName: "Deep",
  lastName: "Bench",
  headshotUrl: "",
  positions: ["C"],
  salary: 1000000,
  teamAbbreviation: "BKN",
};

const rebounder: Player = {
  ...defaultPlayer,
  id: "rebounder",
  positions: ["PF"],
  averageStats: { ...defaultPlayer.averageStats, rebounds: 10 },
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
});
