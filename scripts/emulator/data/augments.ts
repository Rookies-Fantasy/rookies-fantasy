import type { AugmentDoc } from "../types/firestore.js";

export const BLOCK_PARTY: AugmentDoc = {
  id: "block-party",
  title: "Block Party",
  description: "Build your team with 3 players averaging 1+ BLK per game.",
  iconUrl: "block-party.png",
  info: "Only those 3 players gain +25% to BLK.",
  isActive: true,
  playerCount: 3,
  prerequisites: [
    {
      type: "statThreshold",
      condition: {
        count: 3,
        stat: "blocks",
        operator: ">=",
        value: 1,
      },
      description: "3 players averaging 1+ BLK per game",
    },
  ],
  effects: [
    {
      target: "qualifying",
      statBoosts: [{ stat: "blocks", multiplier: 1.25 }],
    },
  ],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const FRONTCOURT_FOCUS: AugmentDoc = {
  id: "frontcourt-focus",
  title: "Frontcourt Focus",
  description: "Build your team with 3 Forwards or Centers each averaging 8+ REB per game.",
  iconUrl: "frontcourt-focus.png",
  info: "Only those 3 players gain +20% to REB.",
  isActive: true,
  playerCount: 3,
  prerequisites: [
    {
      type: "positionRequirement",
      condition: {
        count: 3,
        position: ["SF", "PF", "C"],
      },
      description: "3 Forwards or Centers",
    },
    {
      type: "statThreshold",
      condition: {
        count: 3,
        stat: "rebounds",
        operator: ">=",
        value: 8,
      },
      description: "averaging 8+ REB per game",
    },
  ],
  effects: [
    {
      target: "qualifying",
      statBoosts: [{ stat: "rebounds", multiplier: 1.2 }],
    },
  ],
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const ALL_AUGMENTS: AugmentDoc[] = [BLOCK_PARTY, FRONTCOURT_FOCUS];
