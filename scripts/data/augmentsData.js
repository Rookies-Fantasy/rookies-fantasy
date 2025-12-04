export const augmentsData = [
  {
    title: "Board Lords",
    description: "Build your team with 3 players averaging 8+ REB per game.",
    iconUrl: "board-lords.png",
    info: "Only those 3 players gain +25% to REB.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "rebounds",
          operator: ">=",
          value: 8,
        },
        description: "3 players averaging 8+ REB per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "rebounds",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Assist Leaders",
    description:
      "Build your team with 2 players ranking in the top 20 for AST per game.",
    iconUrl: "assist-leaders.png",
    info: "Only those 2 players gain +20% to AST.",
    prerequisites: [
      {
        type: "playerCount",
        condition: {
          count: 2,
        },
        description: "2 players ranking in the top 20 for AST per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "assists",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Iron Man",
    description: "Build your team with 3 players averaging 28+ MIN per game.",
    iconUrl: "iron-man.png",
    info: "Only those 3 players gain +20% to FPTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "minutes",
          operator: ">=",
          value: 28,
        },
        description: "3 players averaging 28+ MIN per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Fast Pace",
    description:
      "Build your team with 3 players averaging 15+ PTS and 4+ AST per game.",
    iconUrl: "fast-pace.png",
    info: "Only those 3 players gain +20% to PTS and AST.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "points",
          operator: ">=",
          value: 15,
        },
        description: "3 players averaging 15+ PTS per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "assists",
          operator: ">=",
          value: 4,
        },
        description: "3 players averaging 4+ AST per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.2,
          },
          {
            stat: "assists",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Defensive Mindset",
    description:
      "Build your team with 5 players each averaging at least 1 STL per game.",
    iconUrl: "defensive-mindset.png",
    info: "Only those 5 players gain +25% to STL.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 5,
          stat: "steals",
          operator: ">=",
          value: 1,
        },
        description: "5 players each averaging at least 1 STL per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "steals",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Frontcourt Focus",
    description:
      "Build your team with 3 Forwards or Centers each averaging 8+ REB per game.",
    iconUrl: "frontcourt-focus.png",
    info: "Only those 3 players gain +20% to REB.",
    prerequisites: [
      {
        type: "positionRequirement",
        condition: {
          count: 3,
          position: ["SF", "PF", "C"],
        },
        description: "3 Forwards each averaging 8+ REB per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "rebounds",
          operator: ">=",
          value: 8,
        },
        description: "3 players averaging 8+ REB per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "rebounds",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Volume Gunner",
    description:
      "Build your team with 2 players attempting 6+ threes per game.",
    iconUrl: "volume-gunner.png",
    info: "Only those 2 players gain +15% to STL and BLK.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "threePointersAttempted",
          operator: ">=",
          value: 6,
        },
        description: "2 players attempting 6+ threes per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "steals",
            multiplier: 1.15,
          },
          {
            stat: "blocks",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Hustle Squad",
    description:
      "Build your team with 3 players averaging 3+ REB and 1+ STL per game.",
    iconUrl: "hustle-squad.png",
    info: "Only those 3 players gain +20% to REB and STL.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "rebounds",
          operator: ">=",
          value: 3,
        },
        description: "3 players averaging 3+ REB per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "steals",
          operator: ">=",
          value: 1,
        },
        description: "3 players averaging 1+ STL per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "rebounds",
            multiplier: 1.2,
          },
          {
            stat: "steals",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Deep Threat",
    description: "Build your team with 3 players shooting 40%+ from three.",
    iconUrl: "deep-threat.png",
    info: "Only those 3 players gain +15% PTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "threePointerPercentage",
          operator: ">=",
          value: 0.4,
        },
        description: "3 players shooting 40%+ from three",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Block Party",
    description: "Build your team with 3 players averaging 1+ BLK per game.",
    iconUrl: "block-party.png",
    info: "Only those 3 players gain +10% to BLK.",
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
        statBoosts: [
          {
            stat: "blocks",
            multiplier: 1.1,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Underrated Gems",
    description: "Build your team with 3 players costing under $12M each.",
    iconUrl: "underrated-gems.png",
    info: "Only those 3 players gain +20% to FPTS.",
    prerequisites: [
      {
        type: "budgetThreshold",
        condition: {
          count: 3,
          stat: "salary",
          operator: "<",
          value: 12000000,
        },
        description: "3 players costing under $12M each",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Balanced Attack",
    description:
      "Build your team with no player averaging over 20 PTS per game.",
    iconUrl: "balanced-attack.png",
    info: "All players on your team gain +25% to FPTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 8,
          stat: "points",
          operator: "<=",
          value: 20,
        },
        description: "No player averaging over 20 PTS per game",
      },
    ],
    effects: [
      {
        target: "all",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Rookie Showcase",
    description: "Build your team with 2 players averaging 2+ STL per game.",
    iconUrl: "rookie-showcase.png",
    info: "Only those 2 players gain +15% to STL.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "steals",
          operator: ">=",
          value: 2,
        },
        description: "2 players averaging 2+ STL per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "steals",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Scoring Machine",
    description:
      "Build your team with 2 players in their first or second NBA season.",
    iconUrl: "scoring-machine.png",
    info: "Only those 2 players gain +25% to PTS.",
    prerequisites: [
      {
        type: "playerCount",
        condition: {
          count: 2,
        },
        description: "2 players in their first or second NBA season",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Underdog Heroes",
    description: "Build your team with 3 players averaging 18+ PTS per game.",
    iconUrl: "underdog-heroes.png",
    info: "Only those 3 players gain +15% to FPTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "points",
          operator: ">=",
          value: 18,
        },
        description: "3 players averaging 18+ PTS per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Defensive Identity",
    description: "Build your team with 3 players costing under $10M each.",
    iconUrl: "defensive-identity.png",
    info: "Only those 3 players gain +20% to FPTS.",
    prerequisites: [
      {
        type: "budgetThreshold",
        condition: {
          count: 3,
          stat: "salary",
          operator: "<",
          value: 10000000,
        },
        description: "3 players costing under $10M each",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Rebound Kings",
    description: "Build your team with 2 players averaging 10+ REB per game.",
    iconUrl: "rebound-kings.png",
    info: "Only those 2 players gain +15% to REB.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "rebounds",
          operator: ">=",
          value: 10,
        },
        description: "2 players averaging 10+ REB per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "rebounds",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Twin Towers",
    description: "Build your team with 2 centers costing $50M+ together.",
    iconUrl: "twin-towers.png",
    info: "Only those 2 players gain +25% to REB and BLK.",
    prerequisites: [
      {
        type: "positionRequirement",
        condition: {
          count: 2,
          position: ["C"],
        },
        description: "2 centers",
      },
      {
        type: "budgetThreshold",
        condition: {
          count: 2,
          stat: "salary",
          operator: ">=",
          value: 50000000,
        },
        description: "2 centers costing $50M+ together",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "rebounds",
            multiplier: 1.25,
          },
          {
            stat: "blocks",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Free Throw Specialists",
    description:
      "Build your team with 2 players shooting 85%+ from the free throw line.",
    iconUrl: "free-throw-specialists.png",
    info: "Only those 2 players gain +15% to PTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "freeThrowPercentage",
          operator: ">=",
          value: 0.85,
        },
        description: "2 players shooting 85%+ from the free throw line",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Clutch Scorers",
    description: "Build your team with 2 players averaging 20+ PTS per game.",
    iconUrl: "clutch-scorers.png",
    info: "Only those 2 players gain +20% to PTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "points",
          operator: ">=",
          value: 20,
        },
        description: "2 players averaging 20+ PTS per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Low Turnover Crew",
    description:
      "Build your team with 3 players averaging fewer than 1.5 TOV per game.",
    iconUrl: "low-turnover-crew.png",
    info: "Only those 3 players gain +25% to AST.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "turnovers",
          operator: "<",
          value: 1.5,
        },
        description: "3 players averaging fewer than 1.5 TOV per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "assists",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "All-Star Pedigree",
    description:
      "Build your team with 3 players who were All-Stars last season.",
    iconUrl: "all-star-pedigree.png",
    info: "Only those 3 players gain +15% to FPTS.",
    prerequisites: [
      {
        type: "playerCount",
        condition: {
          count: 3,
        },
        description: "3 players who were All-Stars last season",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: false,
  },
  {
    title: "Efficiency Experts",
    description: "Build your team with 3 players shooting 48%+ from the field.",
    iconUrl: "efficiency-experts.png",
    info: "Only those 3 players gain +15% to PTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "fieldGoalPercentage",
          operator: ">=",
          value: 0.48,
        },
        description: "3 players shooting 48%+ from the field",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Backcourt Bombers",
    description: "Build your team with 3 Guards averaging 18+ PTS per game.",
    iconUrl: "backcourt-bombers.png",
    info: "Only those 3 players gain +20% to PTS.",
    prerequisites: [
      {
        type: "positionRequirement",
        condition: {
          count: 3,
          position: ["PG", "SG"],
        },
        description: "3 Point Guards averaging 18+ PTS per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "points",
          operator: ">=",
          value: 18,
        },
        description: "3 players averaging 18+ PTS per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Two-Way Wings",
    description:
      "Build your team with 3 SF/SG players averaging 12+ PTS and 1+ STL per game.",
    iconUrl: "two-way-wings.png",
    info: "Only those 3 players gain +25% to PTS and STL.",
    prerequisites: [
      {
        type: "positionRequirement",
        condition: {
          count: 3,
          position: ["SF", "SG"],
        },
        description: "3 Small Forwards",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "points",
          operator: ">=",
          value: 12,
        },
        description: "3 players averaging 12+ PTS per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "steals",
          operator: ">=",
          value: 1,
        },
        description: "3 players averaging 1+ STL per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.25,
          },
          {
            stat: "steals",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Two-Way Threat",
    description:
      "Build your team with 2 players averaging 15+ PTS and 1+ STL per game.",
    iconUrl: "two-way-threat.png",
    info: "Only those 2 players gain +15% to PTS and STL.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "points",
          operator: ">=",
          value: 15,
        },
        description: "2 players averaging 15+ PTS per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "steals",
          operator: ">=",
          value: 1,
        },
        description: "2 players averaging 1+ STL per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "points",
            multiplier: 1.15,
          },
          {
            stat: "steals",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Position-less Basketball",
    description:
      "Build your team with 2 players eligible to play at least 3 positions.",
    iconUrl: "positionless-basketball.png",
    info: "Only those 2 players gain +10% to FPTS.",
    prerequisites: [
      {
        type: "playerCount",
        condition: {
          count: 2,
          position: ["PG", "SG", "SF", "PF", "C"],
        },
        description: "2 players eligible to play at least 3 positions",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.1,
          },
        ],
      },
    ],
    isActive: false,
  },
  {
    title: "Shot Blockers",
    description: "Build your team with 2 players averaging 1.5+ BLK per game.",
    iconUrl: "shot-blockers.png",
    info: "Only those 2 players gain +25% to BLK.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "blocks",
          operator: ">=",
          value: 1.5,
        },
        description: "2 players averaging 1.5+ BLK per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "blocks",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Floor General",
    description: "Build your team with 3 players averaging 8+ AST per game.",
    iconUrl: "floor-general.png",
    info: "Only those 3 players gain +25% to AST.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "assists",
          operator: ">=",
          value: 8,
        },
        description: "3 players averaging 8+ AST per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "assists",
            multiplier: 1.25,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "All-Around Contributors",
    description:
      "Build your team with 3 players averaging 5+ REB and 3+ AST per game.",
    iconUrl: "all-around-contributors.png",
    info: "Only those 3 players gain +20% to REB and AST.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "rebounds",
          operator: ">=",
          value: 5,
        },
        description: "3 players averaging 5+ REB per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "assists",
          operator: ">=",
          value: 3,
        },
        description: "3 players averaging 3+ AST per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "rebounds",
            multiplier: 1.2,
          },
          {
            stat: "assists",
            multiplier: 1.2,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Defensive Backbone",
    description:
      "Build your team with 3 players averaging 1.2+ STL or BLK per game.",
    iconUrl: "defensive-backbone.png",
    info: "Only those 3 players gain +15% STL and BLK.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "steals",
          operator: ">=",
          value: 1.2,
        },
        description: "3 players averaging 1.2+ STL per game",
      },
      {
        type: "statThreshold",
        condition: {
          count: 3,
          stat: "blocks",
          operator: ">=",
          value: 1.2,
        },
        description: "3 players averaging 1.2+ BLK per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "steals",
            multiplier: 1.15,
          },
          {
            stat: "blocks",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Consistency Counts",
    description: "Build your team with 5 players averaging 25+ MIN per game.",
    iconUrl: "consistency-counts.png",
    info: "Only those 5 players gain +15% to FPTS.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 5,
          stat: "minutes",
          operator: ">=",
          value: 25,
        },
        description: "5 players averaging 25+ MIN per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "fantasyPoints",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
  {
    title: "Defensive Specialists",
    description: "Build your team with 2 players averaging 2+ STL per game.",
    iconUrl: "defensive-specialists.png",
    info: "Only those 2 players gain +15% to STL.",
    prerequisites: [
      {
        type: "statThreshold",
        condition: {
          count: 2,
          stat: "steals",
          operator: ">=",
          value: 2,
        },
        description: "2 players averaging 2+ STL per game",
      },
    ],
    effects: [
      {
        target: "qualifying",
        statBoosts: [
          {
            stat: "steals",
            multiplier: 1.15,
          },
        ],
      },
    ],
    isActive: true,
  },
];
