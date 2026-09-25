import { Firestore } from "firebase-admin/firestore";
import { Augment, AugmentPrerequisite } from "../types/augments";
import { BaseMigration } from "./BaseMigration";
import { augmentsData } from "../data/augmentsData";

/**
 * Calculate the total number of players required for an augment based on prerequisites
 */
const calculatePlayerCount = (prerequisites: AugmentPrerequisite[]): number => {
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

/**
 * Augments Migration
 * Loads augment data from local data file
 */
export class AugmentsMigration extends BaseMigration<Augment> {
  constructor(db: Firestore) {
    super(db, "augments");
  }

  /**
   * Fetch augments data from local file
   */
  async fetchData(): Promise<any[]> {
    console.log("Loading augments from data file...");
    console.log(`Loaded ${augmentsData.length} augments`);
    return augmentsData;
  }

  /**
   * Transform augment data into Augment format
   */
  transform(rawAugment: any): Augment {
    const playerCount = calculatePlayerCount(rawAugment.prerequisites);

    return {
      title: rawAugment.title,
      description: rawAugment.description,
      iconUrl: rawAugment.iconUrl,
      info: rawAugment.info,
      prerequisites: rawAugment.prerequisites,
      effects: rawAugment.effects,
      isActive: rawAugment.isActive !== undefined ? rawAugment.isActive : true,
      playerCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Validate augment data
   */
  validate(augment: Augment): boolean {
    return !!(
      augment.title &&
      augment.description &&
      augment.iconUrl &&
      augment.info &&
      Array.isArray(augment.prerequisites) &&
      Array.isArray(augment.effects) &&
      typeof augment.isActive === "boolean" &&
      typeof augment.playerCount === "number"
    );
  }
}
