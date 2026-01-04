import { Firestore, DocumentData } from "firebase-admin/firestore";
import type { MigrationResult } from "../types/collections.js";

/**
 * Base Migration Class
 * All migration scripts extend this class to provide consistent behavior
 * including validation and batch processing
 */
export abstract class BaseMigration<T extends DocumentData = DocumentData> {
  protected db: Firestore;
  protected collectionName: string;

  constructor(db: Firestore, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }

  // These three functions are for the extended classes

  abstract validate(data: T): boolean;

  abstract fetchData(): Promise<any[]>;

  abstract transform(rawData: any): T;

  /**
   * Prepare migration data (fetch, transform, validate)
   * @returns Validated data ready for insertion
   */
  async prepare(): Promise<T[]> {
    console.log(`Preparing migration: ${this.collectionName}`);

    const rawData = await this.fetchData();
    console.log(`Fetched ${rawData.length} items`);

    const transformedData = rawData.map((item) => this.transform(item));

    const invalidItems = transformedData.filter((item) => !this.validate(item));
    if (invalidItems.length > 0) {
      throw new Error(`Validation failed for ${invalidItems.length} items`);
    }
    console.log(`All ${transformedData.length} items validated`);

    return transformedData;
  }

  /**
   * Execute the migration
   * @param preparedData - Pre-validated data to insert
   * @returns Migration result
   */
  async execute(preparedData: T[]): Promise<MigrationResult> {
    console.log(`\n Inserting data into ${this.collectionName}...`);

    // Clear collection
    const snapshot = await this.db.collection(this.collectionName).get();
    if (!snapshot.empty) {
      const batchSize = 500;
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = this.db.batch();
        const chunk = snapshot.docs.slice(i, i + batchSize);
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      console.log(`Cleared ${snapshot.docs.length} existing documents`);
    }

    // Insert new data in batches
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < preparedData.length; i += batchSize) {
      const batch = this.db.batch();
      const chunk = preparedData.slice(i, i + batchSize);

      chunk.forEach((item) => {
        const docRef = this.db.collection(this.collectionName).doc();
        batch.set(docRef, item);
      });

      await batch.commit();
      inserted += chunk.length;
      console.log(`Progress: ${inserted}/${preparedData.length} documents`);
    }

    console.log(`Migration completed for ${this.collectionName}!`);
    console.log(`Documents created: ${inserted}\n`);

    return {
      success: true,
      collectionName: this.collectionName,
      documentsCreated: inserted,
    };
  }
}
