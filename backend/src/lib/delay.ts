// Polite delays between page actions. Scraping too fast gets you blocked, so we
// space requests out with randomized pauses.

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A randomized pause between minMs and maxMs. */
export function politeDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.round(minMs + Math.random() * Math.max(0, maxMs - minMs));
  return sleep(ms);
}

/** Run a promise with a timeout so a hung page never blocks the pipeline. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
