import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  generateLeagueSchedule,
  LeagueSchedule,
  RandomSource,
  roundRobinCycle,
  ScheduledPairing,
  shuffle,
} from "../../src/leagues/schedule";
import { addDays, SeasonConfig } from "../../src/leagues/season";

// The 2026–27 season seeded by scripts/data/season.ts. It starts on a Tuesday
// and ends on a Sunday, so week 1 defaults to Monday 2026-10-26 and the last
// full week starts Monday 2027-04-05: 24 fantasy weeks in all.
const SEASON: SeasonConfig = {
  season: "2026-27",
  startDate: "2026-10-20",
  endDate: "2027-04-11",
};
const EARLY_DEADLINE = "2026-10-01";
const LAST_FULL_WEEK_START = "2027-04-05";

// mulberry32: a tiny seeded PRNG so shuffles are reproducible.
const seeded = (seed: number): RandomSource => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const teamIds = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `team${i + 1}`);

const pairKey = (pairing: { homeTeamId: string; awayTeamId: string }) =>
  [pairing.homeTeamId, pairing.awayTeamId].sort().join("|");

const scheduleFor = (
  count: number,
  deadline = EARLY_DEADLINE,
  seed = 1,
): LeagueSchedule => {
  const result = generateLeagueSchedule({
    teamIds: teamIds(count),
    season: SEASON,
    deadline,
    random: seeded(seed),
  });
  assert.ok(result.ok, `expected ${count} teams to schedule`);
  return result.schedule;
};

const byWeek = (
  pairings: ScheduledPairing[],
): Map<number, ScheduledPairing[]> => {
  const weeks = new Map<number, ScheduledPairing[]>();
  for (const pairing of pairings) {
    weeks.set(pairing.week, [...(weeks.get(pairing.week) ?? []), pairing]);
  }
  return weeks;
};

const ALL_SIZES = Array.from({ length: 17 }, (_, i) => i + 4); // 4..20

describe("roundRobinCycle", () => {
  for (const count of ALL_SIZES) {
    it(`pairs every team with every other exactly once for ${count} teams`, () => {
      const cycle = roundRobinCycle(teamIds(count));
      const expectedRounds = count % 2 === 0 ? count - 1 : count;
      assert.equal(cycle.length, expectedRounds);

      const seen = new Map<string, number>();
      for (const round of cycle) {
        const playing = round.flatMap((p) => [p.homeTeamId, p.awayTeamId]);
        assert.equal(
          new Set(playing).size,
          playing.length,
          "team twice in a round",
        );
        assert.equal(round.length, Math.floor(count / 2));
        for (const pairing of round) {
          seen.set(pairKey(pairing), (seen.get(pairKey(pairing)) ?? 0) + 1);
        }
      }

      assert.equal(seen.size, (count * (count - 1)) / 2);
      assert.ok([...seen.values()].every((times) => times === 1));
    });

    it(`keeps home and away within one per team for ${count} teams`, () => {
      const balance = new Map<string, number>();
      for (const pairing of roundRobinCycle(teamIds(count)).flat()) {
        balance.set(
          pairing.homeTeamId,
          (balance.get(pairing.homeTeamId) ?? 0) + 1,
        );
        balance.set(
          pairing.awayTeamId,
          (balance.get(pairing.awayTeamId) ?? 0) - 1,
        );
      }
      for (const [team, net] of balance) {
        assert.ok(Math.abs(net) <= 1, `${team} is off by ${net}`);
      }
    });
  }

  it("gives each team exactly one bye per cycle with an odd count", () => {
    const ids = teamIds(7);
    const cycle = roundRobinCycle(ids);
    const byes = new Map<string, number>();
    for (const round of cycle) {
      const playing = new Set(
        round.flatMap((p) => [p.homeTeamId, p.awayTeamId]),
      );
      const resting = ids.filter((id) => !playing.has(id));
      assert.equal(resting.length, 1);
      byes.set(resting[0], (byes.get(resting[0]) ?? 0) + 1);
    }
    assert.deepEqual([...byes.values()].sort(), Array(7).fill(1));
  });
});

describe("shuffle", () => {
  it("is reproducible for a seed and leaves the input alone", () => {
    const ids = teamIds(10);
    const original = [...ids];
    const first = shuffle(ids, seeded(42));
    assert.deepEqual(shuffle(ids, seeded(42)), first);
    assert.deepEqual(ids, original);
    assert.deepEqual([...first].sort(), [...original].sort());
  });
});

describe("generateLeagueSchedule", () => {
  it("refuses leagues below MIN_TEAMS", () => {
    const result = generateLeagueSchedule({
      teamIds: teamIds(3),
      season: SEASON,
      deadline: EARLY_DEADLINE,
      random: seeded(1),
    });
    assert.deepEqual(result, { ok: false, reason: "too-few-teams" });
  });

  it("reserves 2 playoff weeks for 4-team playoffs (up to 9 teams)", () => {
    for (const count of [4, 5, 8, 9]) {
      const schedule = scheduleFor(count);
      assert.equal(schedule.playoffTeams, 4);
      assert.equal(schedule.regularSeasonWeeks, 22);
      assert.equal(schedule.playoffStartWeek, 23);
    }
  });

  it("reserves 3 playoff weeks for 6-team playoffs (10+ teams)", () => {
    for (const count of [10, 11, 20]) {
      const schedule = scheduleFor(count);
      assert.equal(schedule.playoffTeams, 6);
      assert.equal(schedule.regularSeasonWeeks, 21);
      assert.equal(schedule.playoffStartWeek, 22);
    }
  });

  it("starts week 1 on the first Monday on or after the season start", () => {
    const schedule = scheduleFor(8);
    assert.equal(schedule.pairings[0].weekStart, "2026-10-26");
  });

  it("starts week 1 the Monday after a deadline that falls mid-season", () => {
    // A Sunday deadline closes at midnight, so week 1 is the next day.
    assert.equal(
      scheduleFor(8, "2026-11-08").pairings[0].weekStart,
      "2026-11-09",
    );
    // A Monday deadline still allows joins that whole day: week 1 is a week later.
    assert.equal(
      scheduleFor(8, "2026-11-09").pairings[0].weekStart,
      "2026-11-16",
    );
  });

  it("ends the playoffs on the last full week of the NBA season", () => {
    for (const count of [6, 12]) {
      const schedule = scheduleFor(count, "2026-12-15");
      const weekOne = schedule.pairings[0].weekStart;
      const finalWeek = schedule.regularSeasonWeeks + (count >= 10 ? 3 : 2);
      assert.equal(
        schedule.playoffStartWeek + (count >= 10 ? 3 : 2) - 1,
        finalWeek,
      );
      assert.equal(addDays(weekOne, (finalWeek - 1) * 7), LAST_FULL_WEEK_START);
    }
  });

  it("schedules every regular-season week and no playoff weeks", () => {
    for (const count of ALL_SIZES) {
      const schedule = scheduleFor(count);
      const weeks = byWeek(schedule.pairings);
      assert.equal(weeks.size, schedule.regularSeasonWeeks);

      for (const [week, pairings] of weeks) {
        assert.ok(week >= 1 && week < schedule.playoffStartWeek);
        assert.equal(pairings.length, Math.floor(count / 2));
        const playing = pairings.flatMap((p) => [p.homeTeamId, p.awayTeamId]);
        assert.equal(new Set(playing).size, playing.length);
        assert.ok(pairings.every((p) => p.weekStart === pairings[0].weekStart));
      }
    }
  });

  it("repeats the cycle with sides swapped, allowing a partial last cycle", () => {
    // 20 teams: a 19-week cycle, then weeks 20–21 replay rounds 1–2 swapped.
    const schedule = scheduleFor(20);
    const weeks = byWeek(schedule.pairings);
    const sides = (week: number) =>
      (weeks.get(week) ?? [])
        .map((p) => `${p.homeTeamId}>${p.awayTeamId}`)
        .sort();
    const swapped = (week: number) =>
      (weeks.get(week) ?? [])
        .map((p) => `${p.awayTeamId}>${p.homeTeamId}`)
        .sort();

    assert.deepEqual(sides(20), swapped(1));
    assert.deepEqual(sides(21), swapped(2));
  });

  it("schedules the latest deadline creation allows, and nothing later", () => {
    // 4-team playoffs need 3 regular + 2 playoff weeks: week 1 on 2027-03-08.
    assert.equal(scheduleFor(4, "2027-03-07").regularSeasonWeeks, 3);
    assert.deepEqual(
      generateLeagueSchedule({
        teamIds: teamIds(4),
        season: SEASON,
        deadline: "2027-03-14",
        random: seeded(1),
      }),
      { ok: false, reason: "season-too-short" },
    );

    // 6-team playoffs need 3 regular + 3 playoff weeks: week 1 on 2027-03-01.
    assert.equal(scheduleFor(10, "2027-02-28").regularSeasonWeeks, 3);
    assert.deepEqual(
      generateLeagueSchedule({
        teamIds: teamIds(10),
        season: SEASON,
        deadline: "2027-03-07",
        random: seeded(1),
      }),
      { ok: false, reason: "season-too-short" },
    );
  });

  it("is deterministic for a seed", () => {
    assert.deepEqual(
      scheduleFor(9, EARLY_DEADLINE, 7),
      scheduleFor(9, EARLY_DEADLINE, 7),
    );
  });
});
