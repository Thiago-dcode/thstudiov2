export const MEDIA_UPLOAD_CONCURRENCY = 3;
export const MEDIA_UPLOAD_MAX_RETRIES = 3;
export const MEDIA_UPLOAD_RETRY_BASE_DELAY_MS = 1000;

export async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<unknown>,
): Promise<void> {
  if (items.length === 0) return;

  let index = 0;
  const workerCount = Math.min(limit, items.length);

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      await fn(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

export function isTransientMediaUploadError(errors: string[]): boolean {
  return errors.some((message) =>
    /connection timeout|timeout exceeded|internal server error|failed to fetch|network/i.test(
      message,
    ),
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
