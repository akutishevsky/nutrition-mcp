// Generic in-memory TTL cache with in-flight coalescing. Pure (no
// Supabase/Hono import) so it can be unit-tested and reused by any route that
// wants "serve a cached value, refresh it on expiry, and fall back to the
// last-good value if the refresh fails" — the pattern src/index.ts's
// /api/stats and /api/patreon-posts routes used to hand-roll separately.
export interface TtlCacheResult<T> {
    data: T;
    stale: boolean;
}

interface Entry<T> {
    data: T;
    expiresAt: number;
}

export function createTtlCache<T>(
    ttlMs: number,
    fetcher: () => Promise<T>,
): () => Promise<TtlCacheResult<T>> {
    let entry: Entry<T> | null = null;
    // Coalesces concurrent callers arriving while a refresh is already in
    // flight onto the SAME fetcher() call, rather than each starting their
    // own — the fix for a burst of requests at cache expiry (or during an
    // outage) each hitting the underlying fetcher once per request.
    let inFlight: Promise<T> | null = null;

    return async function get(): Promise<TtlCacheResult<T>> {
        if (entry && entry.expiresAt >= Date.now()) {
            return { data: entry.data, stale: false };
        }

        if (!inFlight) {
            inFlight = fetcher().finally(() => {
                inFlight = null;
            });
        }

        try {
            const data = await inFlight;
            entry = { data, expiresAt: Date.now() + ttlMs };
            return { data, stale: false };
        } catch (err) {
            // No data at all: nothing to serve, so let the caller decide what
            // "broken with an empty cache" means for their route.
            if (!entry) throw err;
            return { data: entry.data, stale: true };
        }
    };
}
