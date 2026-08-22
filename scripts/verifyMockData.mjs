/**
 * Post-seed verification (run under the emulator, e.g. via emulators:exec).
 * Confirms the augment-validation crash condition is gone: every lineup/bench
 * player carries averageStats, and a ported validateAugment() runs without
 * throwing on every seeded team.
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({ projectId: "rookies-fantasy-development" });
const db = getFirestore();

// --- minimal port of client/utils/augmentUtils.ts crash path -----------------
const getStatValue = (stats, stat) => {
  switch (stat) {
    case "points": return stats.points;
    case "rebounds": return stats.rebounds;
    case "assists": return stats.assists;
    case "steals": return stats.steals;
    case "blocks": return stats.blocks;
    case "turnovers": return stats.turnovers;
    case "minutes": return stats.minutes;
    default: return 0;
  }
};
const cmp = (a, op, b) =>
  ({ ">=": a >= b, ">": a > b, "<=": a <= b, "<": a < b, "=": a === b }[op] ?? false);

const validateAugment = (augment, lineup) => {
  if (!augment) return { isValid: false };
  const players = lineup.filter((s) => s.player !== null).map((s) => s.player);
  let qualifying = [];
  const unmet = [];
  for (const pre of augment.prerequisites) {
    const c = pre.condition;
    let res = [];
    if (pre.type === "statThreshold") {
      res = players.filter((p) => cmp(getStatValue(p.averageStats, c.stat), c.operator, c.value));
    } else if (pre.type === "positionRequirement") {
      res = players.filter((p) => p.positions.some((pos) => c.position.includes(pos)));
    }
    if (res.length < c.count) unmet.push(pre.description);
    qualifying = qualifying.length === 0 ? res : qualifying.filter((p) => res.some((q) => q.id === p.id));
  }
  return { isValid: unmet.length === 0 && qualifying.length >= augment.playerCount, qualifying: qualifying.length };
};

// Valid asset urls (mirror client/types/asset.ts).
const AVATAR_URLS = Array.from({ length: 9 }, (_, i) => `../assets/images/profile/${i + 1}.png`)
  .concat("../assets/images/placeholder-avatar.png");
const LOGO_URLS = Array.from({ length: 8 }, (_, i) => `../assets/images/team/${i + 1}.png`);

// ----------------------------------------------------------------------------
let ok = true;
const augments = new Map(
  (await db.collection("augments").get()).docs.map((d) => [d.id, d.data()]),
);

// --- user registration gate (selectIsUserRegistered / selectIsTeamRegistered)
console.log("— user registration —");
const userSnaps = await db.collection("users").get();
for (const userDoc of userSnaps.docs) {
  const u = userDoc.data();
  const dobOk = typeof u.dateOfBirth?.toDate === "function"; // Firestore Timestamp
  const avatarOk = AVATAR_URLS.includes(u.avatarUrl) && u.avatarUrl !== "../assets/images/placeholder-avatar.png";
  const userRegistered = !!u.id && !!u.username && dobOk && !!u.avatarUrl;
  if (!dobOk || !avatarOk || !userRegistered) {
    ok = false;
    console.log(`❌ ${userDoc.id}: registered=${userRegistered} dobIsTimestamp=${dobOk} avatarValid=${avatarOk} (${u.avatarUrl})`);
  } else {
    const teams = await db.collection("users").doc(userDoc.id).collection("teams").get();
    const ranked = teams.docs.map((d) => d.data()).find((t) => !t.isLeagueTeam);
    const teamRegistered = !!ranked?.id && !!ranked?.abbreviation && !!ranked?.logoUrl && !!ranked?.name;
    const logoOk = LOGO_URLS.includes(ranked?.logoUrl);
    if (!teamRegistered || !logoOk) {
      ok = false;
      console.log(`❌ ${userDoc.id}: rankedTeamRegistered=${teamRegistered} logoValid=${logoOk} (${ranked?.logoUrl})`);
    } else {
      console.log(`✓ ${userDoc.id} (${u.username}) → userRegistered + rankedTeamRegistered, dob=Timestamp, avatar+logo valid`);
    }
  }
}

console.log("\n— augment validation / averageStats —");
for (const userDoc of userSnaps.docs) {
  const teams = await db.collection("users").doc(userDoc.id).collection("teams").get();
  for (const t of teams.docs) {
    const data = t.data();
    const slots = [...(data.lineup ?? []), ...(data.bench ?? [])].filter((s) => s.player);

    // 1) crash condition: every lineup/bench player must carry averageStats.blocks
    for (const s of slots) {
      const b = s.player.averageStats?.blocks;
      if (typeof b !== "number") {
        ok = false;
        console.log(`❌ ${userDoc.id}/${data.name} ${s.position} ${s.player.firstName} ${s.player.lastName}: averageStats.blocks = ${b}`);
      }
    }

    // 2) run the ported validation exactly as selectIsAugmentValid would
    try {
      const aug = data.augmentId ? augments.get(data.augmentId) : undefined;
      const r = validateAugment(aug, data.lineup ?? []);
      console.log(`✓ ${data.name} (${data.augmentId ?? "no augment"}) → valid=${r.isValid} qualifying=${r.qualifying ?? "-"} | ${slots.length} players all have averageStats`);
    } catch (err) {
      ok = false;
      console.log(`❌ validateAugment threw for ${data.name}: ${err.message}`);
    }
  }
}

console.log(ok ? "\n✅ VERIFICATION PASSED — no undefined averageStats, no throws" : "\n❌ VERIFICATION FAILED");
process.exit(ok ? 0 : 1);
