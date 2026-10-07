// The project's GitHub star count, fetched by the server and cached in
// memory, so the public site can show it without any visitor's browser ever
// contacting GitHub (the privacy policy says so in all ten locales). Served
// at GET /api/github-stars (src/index.ts) and painted into every
// [data-gh-stars] badge by public/site.js.
//
// No user data goes into the request: it is one unauthenticated GET for the
// repo's public metadata, made from the server's own address. Unauthenticated
// GitHub API calls are limited to 60 an hour per IP, so a failure is cached
// too (RETRY_MS) rather than retried on every page view, and a failed refresh
// keeps serving the last good count.

export const GITHUB_REPO = "akutishevsky/nutrition-mcp";
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;

export const STARS_TTL_MS = 60 * 60 * 1000;
export const STARS_RETRY_MS = 5 * 60 * 1000;
export const STARS_TIMEOUT_MS = 3_000;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** One GitHub API call. Throws on a non-2xx, a timeout or a malformed body. */
export async function fetchStarCount(
    fetchImpl: FetchLike = fetch,
    timeoutMs: number = STARS_TIMEOUT_MS,
): Promise<number> {
    const res = await fetchImpl(API_URL, {
        headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "nutrition-mcp",
        },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const body = (await res.json()) as { stargazers_count?: unknown };
    const n = body.stargazers_count;
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
        throw new Error("GitHub API: no stargazers_count");
    }
    return n;
}

export interface StarCounterOptions {
    fetchStars?: () => Promise<number>;
    ttlMs?: number;
    retryMs?: number;
    now?: () => number;
}

/**
 * Returns a getter resolving to the cached count, or null when GitHub has
 * never answered. Concurrent callers share one in-flight request; after a
 * success nothing is fetched for `ttlMs`, after a failure for `retryMs`.
 * The getter never throws.
 */
export function createStarCounter(
    opts: StarCounterOptions = {},
): () => Promise<number | null> {
    const fetchStars = opts.fetchStars ?? (() => fetchStarCount());
    const ttlMs = opts.ttlMs ?? STARS_TTL_MS;
    const retryMs = opts.retryMs ?? STARS_RETRY_MS;
    const now = opts.now ?? Date.now;

    let value: number | null = null;
    let nextFetchAt = 0;
    let inFlight: Promise<void> | null = null;

    return async function get(): Promise<number | null> {
        if (now() < nextFetchAt) return value;
        if (!inFlight) {
            inFlight = fetchStars()
                .then(
                    (n) => {
                        value = n;
                        nextFetchAt = now() + ttlMs;
                    },
                    (err) => {
                        // Keep the last good count; just wait before retrying.
                        nextFetchAt = now() + retryMs;
                        console.error(
                            `[github-stars] fetch failed: ${err instanceof Error ? err.message : String(err)}`,
                        );
                    },
                )
                .finally(() => {
                    inFlight = null;
                });
        }
        await inFlight;
        return value;
    };
}
