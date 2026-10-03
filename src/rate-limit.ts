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
// Per-user limit for the Apple Health sync API (/pending, /ack, /revoke),
// keyed by user id like LIMIT_PER_WINDOW. A full sync is one /pending, one
// /ack per entry (at most one entry per day of the 7-day window) and a final
// done:true /ack — at most 9 requests — so this leaves room for a retried run
// without letting a looping shortcut hammer the meal reads behind /pending.
export const HEALTH_SYNC_LIMIT_PER_WINDOW = 40;
// Process-wide counters for the two unauthenticated health-sync calls. The
// per-IP auth limiter keys on getClientIp, which trusts a spoofable
// x-forwarded-for, so a caller rotating that header gets a fresh bucket per
// request. /start writes a pending row per call, so its counter is a hard cap
// (60/min is far above real pairing traffic): it bounds those writes, at the
// accepted price that a flood can hold off new pairings while it lasts (see
// the /start route). /claim counts only FAILED claims, and is NOT a gate —
// any caller could fill a global gate and switch pairing off for everyone,
// while a claim needs two independent 256-bit secrets that no volume of
// guesses finds. Going over its limit only flags the log line
// (`alert=claim_failures_high`).
export const HEALTH_SYNC_START_GLOBAL_LIMIT = 60;
export const HEALTH_SYNC_CLAIM_FAILURE_GLOBAL_LIMIT = 30;
const GLOBAL_KEY = "global";
const SWEEP_INTERVAL_MS = 5 * 60_000;

// Strike-based banning for IPs that keep failing authentication. A sliding
// window alone can't distinguish "client with a stale token retrying" from
// "attacker enumerating credentials", so we count *consecutive* failures: any
// successful auth from the IP wipes the slate. That's what keeps a corporate
// NAT — one broken client sharing an egress IP with real users — off the ban
// list, since its successes keep interrupting the run of failures.
const BAN_STRIKE_THRESHOLD = 20;
// Escalating ban lengths for repeat offenders, capped at the last entry so a
// persistent attacker plateaus rather than being locked out permanently.
const BAN_DURATIONS_MS = [5, 10, 20, 40, 60].map((m) => m * 60_000);
// Strikes are only "consecutive" if they're close together — an IP that
// trickles a stray 401 every so often should never accumulate its way to a ban.
const STRIKE_DECAY_MS = 10 * 60_000;
// Forgive the escalation level too, eventually, so a one-off bad afternoon
// doesn't make an IP a permanent repeat offender.
const ESCALATION_DECAY_MS = 6 * 60 * 60_000;

interface AuthFailureEntry {
    // Consecutive failures since the last success, ban, or decay.
    strikes: number;
    lastFailureAt: number;
    // Epoch ms the current ban ends; 0 when not banned.
    bannedUntil: number;
    // Index into BAN_DURATIONS_MS for the *next* ban this IP earns.
    escalation: number;
}

const buckets = new Map<string, number[]>();
const authBuckets = new Map<string, number[]>();
const authFailures = new Map<string, AuthFailureEntry>();
const healthSyncBuckets = new Map<string, number[]>();
const healthSyncStartBuckets = new Map<string, number[]>();
const healthSyncClaimFailureBuckets = new Map<string, number[]>();

// Periodically drop buckets whose newest entry is older than the window, so
// a caller who stops making requests doesn't keep a slot in the Map forever.
setInterval(() => {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    for (const map of [
        buckets,
        authBuckets,
        healthSyncBuckets,
        healthSyncStartBuckets,
        healthSyncClaimFailureBuckets,
    ]) {
        for (const [key, timestamps] of map) {
            const last = timestamps[timestamps.length - 1];
            if (last == null || last < cutoff) {
                map.delete(key);
            }
        }
    }
    // A failure entry is only droppable once it holds nothing we'd act on:
    // no live ban, and idle long enough that both the strikes and the
    // escalation level would have decayed to zero anyway.
    for (const [ip, entry] of authFailures) {
        if (
            entry.bannedUntil <= now &&
            now - entry.lastFailureAt >= ESCALATION_DECAY_MS
        ) {
            authFailures.delete(ip);
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

// Per-user limiter for the Apple Health sync API, keyed by user id.
export function checkHealthSyncRateLimit(userId: string): RateLimitResult {
    return slidingWindow(
        healthSyncBuckets,
        userId,
        HEALTH_SYNC_LIMIT_PER_WINDOW,
    );
}

// Process-wide cap on POST /api/v1/health-sync/start. Counts the call.
export function checkHealthSyncStartGlobalLimit(): RateLimitResult {
    return slidingWindow(
        healthSyncStartBuckets,
        GLOBAL_KEY,
        HEALTH_SYNC_START_GLOBAL_LIMIT,
    );
}

// Record one failed /claim against the process-wide counter. Not a gate: the
// result only says whether the count is over HEALTH_SYNC_CLAIM_FAILURE_GLOBAL_LIMIT,
// which the route reports as an alert on its log line.
export function noteHealthSyncClaimFailure(): RateLimitResult {
    return slidingWindow(
        healthSyncClaimFailureBuckets,
        GLOBAL_KEY,
        HEALTH_SYNC_CLAIM_FAILURE_GLOBAL_LIMIT,
    );
}

export interface BanState {
    banned: boolean;
    retryAfterSeconds?: number;
}

const NOT_BANNED: BanState = { banned: false };

function bannedState(bannedUntil: number, now: number): BanState {
    // Round up and floor at 1: a Retry-After of 0 invites an instant retry.
    return {
        banned: true,
        retryAfterSeconds: Math.max(1, Math.ceil((bannedUntil - now) / 1000)),
    };
}

// Record one failed (401) unauthenticated attempt from this IP and report the
// resulting ban state.
export function noteAuthFailure(ip: string): BanState {
    const now = Date.now();
    const entry = authFailures.get(ip) ?? {
        strikes: 0,
        lastFailureAt: now,
        bannedUntil: 0,
        escalation: 0,
    };

    const idle = now - entry.lastFailureAt;
    if (idle >= ESCALATION_DECAY_MS) {
        entry.escalation = 0;
        entry.strikes = 0;
    } else if (idle >= STRIKE_DECAY_MS) {
        entry.strikes = 0;
    }
    entry.lastFailureAt = now;

    if (entry.bannedUntil > now) {
        // Deliberately no strike, no extension: a client hammering through its
        // ban would otherwise renew it forever and never get a chance to come
        // back with a fixed token. Escalation is earned by tripping a *new*
        // ban after this one expires, not by keeping this one alive.
        authFailures.set(ip, entry);
        return bannedState(entry.bannedUntil, now);
    }

    entry.strikes++;
    if (entry.strikes >= BAN_STRIKE_THRESHOLD) {
        const duration =
            BAN_DURATIONS_MS[
                Math.min(entry.escalation, BAN_DURATIONS_MS.length - 1)
            ]!;
        entry.bannedUntil = now + duration;
        entry.escalation++;
        // Start the next run from scratch; the ban itself is the punishment
        // for the strikes just spent.
        entry.strikes = 0;
        authFailures.set(ip, entry);
        return bannedState(entry.bannedUntil, now);
    }

    authFailures.set(ip, entry);
    return NOT_BANNED;
}

// Clear strikes and any active ban for this IP, called whenever auth succeeds.
// The escalation level survives, so an attacker can't launder a repeat-offender
// record with a single valid request between rounds.
export function clearAuthFailures(ip: string): void {
    const entry = authFailures.get(ip);
    if (!entry) return;
    entry.strikes = 0;
    entry.bannedUntil = 0;
    if (entry.escalation === 0) {
        // Nothing left worth remembering — don't hold the slot.
        authFailures.delete(ip);
    }
}

// Read-only view of the ban state; does not count as an attempt.
export function getBanState(ip: string): BanState {
    const entry = authFailures.get(ip);
    if (!entry) return NOT_BANNED;
    const now = Date.now();
    if (entry.bannedUntil <= now) return NOT_BANNED;
    return bannedState(entry.bannedUntil, now);
}

// Exposed for tests.
export function _resetBuckets(): void {
    buckets.clear();
    authBuckets.clear();
    authFailures.clear();
    healthSyncBuckets.clear();
    healthSyncStartBuckets.clear();
    healthSyncClaimFailureBuckets.clear();
}
