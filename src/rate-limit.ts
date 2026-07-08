// In-memory sliding-window rate limiter. Fine for the current single-instance
// deployment; swap for a shared store if we ever scale horizontally.

const WINDOW_MS = 60_000;
// Per-user limit for authenticated MCP traffic, keyed by user id.
const LIMIT_PER_WINDOW = 60;
// Tighter per-IP limit for the unauthenticated OAuth endpoints. Users have no
// user id yet at this stage, so we key on client IP. A full login flow is only
// a handful of requests (authorize → approve → token), so this leaves ample
// headroom for legitimate use — even shared NAT'd IPs — while blocking bulk
// signup/credential-stuffing abuse.
const AUTH_LIMIT_PER_WINDOW = 30;
const SWEEP_INTERVAL_MS = 5 * 60_000;

const buckets = new Map<string, number[]>();
const authBuckets = new Map<string, number[]>();

// Periodically drop buckets whose newest entry is older than the window, so
// a caller who stops making requests doesn't keep a slot in the Map forever.
setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS;
    for (const map of [buckets, authBuckets]) {
        for (const [key, timestamps] of map) {
            const last = timestamps[timestamps.length - 1];
            if (last == null || last < cutoff) {
                map.delete(key);
            }
        }
    }
}, SWEEP_INTERVAL_MS);

export interface RateLimitResult {
    allowed: boolean;
    retryAfterSeconds?: number;
    remaining: number;
    limit: number;
}

// Shared sliding-window check against a given bucket store and limit.
function slidingWindow(
    store: Map<string, number[]>,
    key: string,
    limit: number,
): RateLimitResult {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    const existing = store.get(key) ?? [];

    // Trim in place: keep only entries within the window.
    let keepFrom = 0;
    while (keepFrom < existing.length && existing[keepFrom]! <= cutoff) {
        keepFrom++;
    }
    const trimmed = keepFrom === 0 ? existing : existing.slice(keepFrom);

    if (trimmed.length >= limit) {
        const oldest = trimmed[0]!;
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((oldest + WINDOW_MS - now) / 1000),
        );
        store.set(key, trimmed);
        return {
            allowed: false,
            retryAfterSeconds,
            remaining: 0,
            limit,
        };
    }

    trimmed.push(now);
    store.set(key, trimmed);
    return {
        allowed: true,
        remaining: limit - trimmed.length,
        limit,
    };
}

export function checkRateLimit(userId: string): RateLimitResult {
    return slidingWindow(buckets, userId, LIMIT_PER_WINDOW);
}

// Per-IP limiter for the unauthenticated OAuth endpoints.
export function checkAuthRateLimit(ip: string): RateLimitResult {
    return slidingWindow(authBuckets, ip, AUTH_LIMIT_PER_WINDOW);
}

// Exposed for tests.
export function _resetBuckets(): void {
    buckets.clear();
    authBuckets.clear();
}
