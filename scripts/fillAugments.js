import "dotenv/config";
import { db } from "./firebaseConfig.js";
import augmentsData from "./data/augmentsData.js";

/**
 * Calculate the total number of players required for an augment based on prerequisites
 */
const calculatePlayerCount = (prerequisites) => {
  if (!prerequisites || prerequisites.length === 0) return 0;

  // Get all counts from prerequisites
  const counts = prerequisites
    .map((prereq) => prereq.condition?.count || 0)
    .filter((count) => count > 0);

  if (counts.length === 0) return 0;

  // Check if all prerequisites have the same count
  // If they do, it's likely the SAME players meeting multiple conditions
  const allSameCount = counts.every((count) => count === counts[0]);

  if (allSameCount) {
    // Same count across all prerequisites = same players
    // Example: "3 players with 15+ PTS AND 4+ AST" = 3 players total
    return counts[0];
  } else {
    // Different counts = likely different sets of players
    // Example: "2 centers" + "those 2 costing $50M+" = 2 players total (same 2)
    // But we use max as a safe default since most augments overlap
    return Math.max(...counts);
  }
};

const fillAugments = async () => {
  try {
    const augmentsCollection = db.collection("augments");
    const batch = db.batch();

    let insertCount = 0;

    for (const augment of augmentsData) {
      // Create a new document reference with auto-generated ID
      const docRef = augmentsCollection.doc();

      // Add timestamps and playerCount
      const augmentWithTimestamps = {
        ...augment,
        playerCount: calculatePlayerCount(augment.prerequisites),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      batch.set(docRef, augmentWithTimestamps);
      insertCount++;
    }

    await batch.commit();
    console.log(
      `Successfully created ${insertCount} augments in the 'augments' collection!`
    );
  } catch (error) {
    console.error("Error filling augments:", error);
  }
};

// Run the function
fillAugments();
