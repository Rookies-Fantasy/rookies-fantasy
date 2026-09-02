// Splits a list into consecutive chunks of at most `size`. Used both to keep the
// standings fan-out bounded and to stay inside Firestore's 30-value ceiling on
// `documentId() in [...]` filters.
export const chunk = <T>(items: T[], size: number): T[][] => {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError("chunk size must be a positive integer");
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

// Runs `worker` over `items` with at most `limit` calls in flight at a time,
// preserving input order in the result. Replaces an unbounded
// `Promise.all(items.map(...))`, which would open one Firestore connection per
// league member simultaneously.
export const mapInBatches = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> => {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new RangeError("concurrency limit must be a positive integer");
  }

  const results: R[] = [];
  for (const batch of chunk(items, limit)) {
    const batchResults = await Promise.all(batch.map(worker));
    results.push(...batchResults);
  }
  return results;
};
