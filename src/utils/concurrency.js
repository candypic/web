// Runs `worker` over `items` with at most `limit` in flight at once, instead
// of the all-at-once (browser/network-overwhelming) or fully-sequential
// (needlessly slow) extremes. Each item's own success/failure is the
// worker's responsibility to catch — a rejection here just stops that
// item's runner, not the whole batch.
export async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const workerCount = Math.max(1, Math.min(limit, queue.length));

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        await worker(item);
      }
    })
  );
}
