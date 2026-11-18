import type { AugmentDefinition } from "../fixtures/augments.js";

export const DEFAULT_AUGMENTS: readonly AugmentDefinition[] = [
  {
    id: "seed-augment",
    title: "Board Lords",
    description: "Build your team with 3 players averaging 8+ REB per game.",
    iconUrl: "board-lords.png",
    info: "Only those 3 players gain +25% to REB.",
    isActive: true,
    playerCount: 3,
    prerequisites: [
      {
        type: "statThreshold",
        condition: { count: 3, stat: "rebounds", operator: ">=", value: 8 },
        description: "3 players averaging 8+ REB per game",
      },
    ],
    effects: [
      {
        statBoosts: [{ stat: "rebounds", multiplier: 1.25 }],
      },
    ],
  },
];
