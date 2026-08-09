/**
 * Migration system types
 */
export type MigrationResult = {
  success: boolean;
  collectionName: string;
  documentsCreated: number;
  error?: string;
};
