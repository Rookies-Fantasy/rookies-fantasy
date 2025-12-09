import { db } from "./firebaseConfig.js";

async function addRecordToExistingTeams() {
  console.log(
    "🔄 Starting migration to add record field to existing teams...\n"
  );

  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();
    console.log(`Found ${usersSnapshot.size} users\n`);

    let totalTeamsUpdated = 0;
    let totalTeamsSkipped = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Processing user: ${userId}`);

      // Get all teams for this user
      const teamsSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("teams")
        .get();

      console.log(`  Found ${teamsSnapshot.size} team(s)`);

      for (const teamDoc of teamsSnapshot.docs) {
        const teamId = teamDoc.id;
        const teamData = teamDoc.data();

        // Check if record already exists
        if (teamData.record) {
          console.log(
            `  ⏭️  Team ${teamId} already has a record (${teamData.record.wins}-${teamData.record.losses}-${teamData.record.draws}), skipping`
          );
          totalTeamsSkipped++;
          continue;
        }

        // Add record field
        await teamDoc.ref.update({
          record: {
            wins: 0,
            losses: 0,
            draws: 0,
          },
        });

        console.log(`  ✅ Updated team ${teamId} with record: 0-0-0`);
        totalTeamsUpdated++;
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✨ Migration completed successfully!");
    console.log(`📊 Teams updated: ${totalTeamsUpdated}`);
    console.log(`⏭️  Teams skipped (already had record): ${totalTeamsSkipped}`);
    console.log(
      `📈 Total teams processed: ${totalTeamsUpdated + totalTeamsSkipped}`
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

addRecordToExistingTeams()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
