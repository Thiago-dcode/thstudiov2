/** Rejects if `probe` has not settled within `ms`; always clears its timer. */
export async function withTimeout<T>(probe: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    try {
        return await Promise.race([
            probe,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}
