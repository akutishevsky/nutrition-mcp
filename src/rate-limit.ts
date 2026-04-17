// In-memory sliding-window rate limiter, keyed by user id. Fine for the
// current single-instance deployment; swap for a shared store if we ever
// scale horizontally.

const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = 60;
const SWEEP_INTERVAL_MS = 5 * 60_000;

const buckets = new Map<string, number[]>();

// Periodically drop buckets whose newest entry is older than the window, so
// a user who stops making requests doesn't keep a slot in the Map forever.
setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const [key, timestamps] of buckets) {
        const last = timestamps[timestamps.length - 1];
        if (last == null || last < cutoff) {
            buckets.delete(key);
        }
    }
}, SWEEP_INTERVAL_MS);

export interface RateLimitResult {
    allowed: boolean;
    retryAfterSeconds?: number;
    remaining: number;
    limit: number;
}

export function checkRateLimit(userId: string): RateLimitResult {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    const existing = buckets.get(userId) ?? [];

    // Trim in place: keep only entries within the window.
    let keepFrom = 0;
    while (keepFrom < existing.length && existing[keepFrom]! <= cutoff) {
        keepFrom++;
    }
    const trimmed = keepFrom === 0 ? existing : existing.slice(keepFrom);

    if (trimmed.length >= LIMIT_PER_WINDOW) {
        const oldest = trimmed[0]!;
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((oldest + WINDOW_MS - now) / 1000),
        );
        buckets.set(userId, trimmed);
        return {
            allowed: false,
            retryAfterSeconds,
            remaining: 0,
            limit: LIMIT_PER_WINDOW,
        };
    }

    trimmed.push(now);
    buckets.set(userId, trimmed);
    return {
        allowed: true,
        remaining: LIMIT_PER_WINDOW - trimmed.length,
        limit: LIMIT_PER_WINDOW,
    };
}

// Exposed for tests.
export function _resetBuckets(): void {
    buckets.clear();
}
