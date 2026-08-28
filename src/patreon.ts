// Patreon API v2 client for the landing page's "recent posts" strip. Pure
// fetch/normalize logic, deliberately free of Supabase access — same
// separation convention as src/import.ts: takes an injected PatreonTokenStore
// rather than calling getSupabase() itself, so this unit-tests with a plain
// in-memory fixture instead of mocking the database.

const POSTS_URL_BASE = "https://www.patreon.com/api/oauth2/v2/campaigns";
const TOKEN_URL = "https://www.patreon.com/api/oauth2/token";
const PATREON_ORIGIN = "https://www.patreon.com";
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_POSTS = 12;
// Refresh proactively once the stored token is this close to expiring, so a
// posts fetch never races an access token going stale mid-request.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

// The campaign behind this integration covers more than one project (its
// "Welcome" post introduces both Withings MCP and Nutrition MCP) — so
// showing every public post on the Nutrition MCP landing page would include
// updates about an unrelated product. Patreon's API has no tag/category
// field or filter on posts (confirmed: `include=user_defined_tags` on the
// live API returns 400 ParameterInvalidOnType — the only documented post
// relationships are `campaign` and `user`), so there is no server-side way
// to ask Patreon for "just the Nutrition MCP ones." Instead, the creator
// marks a post as relevant by writing this literal text somewhere in its
// title or body — matched case-insensitively — and this filter is the other
// half of that convention.
const TAG_MARKER = "#nutrition-mcp";

// Plain-text excerpt length. Long enough to read as a real preview, short
// enough that a title plus this still fit one compact card.
const PREVIEW_MAX_CHARS = 160;

export interface PatreonTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: string; // ISO 8601
}

export interface PatreonTokenStore {
    getTokens(): Promise<PatreonTokens | null>;
    saveTokens(tokens: PatreonTokens): Promise<void>;
}

export interface PatreonConfig {
    clientId: string;
    clientSecret: string;
    campaignId: string;
}

export interface PatreonPost {
    title: string;
    preview: string;
    url: string;
    publishedAt: string; // ISO 8601
}

interface PatreonPostAttributes {
    title: string;
    content: string; // post body, as HTML
    url: string;
    published_at: string;
    is_public: boolean;
    is_paid: boolean;
}

interface PatreonPostsResponse {
    data: { id: string; type: string; attributes: PatreonPostAttributes }[];
}

interface PatreonTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number; // seconds
}

// Concurrent callers WITHIN THIS PROCESS must share one in-flight refresh:
// Patreon invalidates the old refresh token the instant it's used, so two
// concurrent refreshes would race — the second one's refresh_token argument
// is already dead by the time it fires, and would fail (or worse, silently
// invalidate what the first refresh just obtained). Cleared once the promise
// settles (success or failure, via .finally()) so a later expiry can trigger
// a fresh refresh rather than being stuck reusing a resolved-long-ago
// promise. This guard is process-local and does NOT cover a multi-replica
// deploy, where every replica reads the same shared `patreon_tokens` row —
// see refreshAndPersist's recovery branch for the cross-replica case.
let refreshInFlight: Promise<PatreonTokens> | null = null;

async function refreshTokens(
    refreshToken: string,
    config: PatreonConfig,
): Promise<PatreonTokens> {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: config.clientId,
            client_secret: config.clientSecret,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
        throw new Error(`Patreon token refresh failed: ${res.status}`);
    }
    const data = (await res.json()) as PatreonTokenResponse;
    if (!data.access_token || !data.refresh_token) {
        throw new Error("Patreon token refresh response missing tokens");
    }
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
}

// Does the actual refresh-and-persist cycle; this IS what refreshInFlight
// holds, so saveTokens runs exactly once per refresh cycle no matter how many
// callers are awaiting it (see getValidAccessToken).
//
// On failure, re-reads the store once before giving up: on a rolling
// redeploy, two replicas can each see the same near-expiry token at nearly
// the same moment and both attempt a refresh with it. Patreon invalidates a
// refresh token the instant it's used, so whichever replica's request lands
// second gets a hard failure even though another replica already fixed the
// token situation. Re-reading distinguishes "another replica beat me to it"
// (the stored tokens now differ from what this process just tried to
// refresh — use them) from "the refresh is genuinely broken" (the stored
// tokens are unchanged — propagate the error). The recovered tokens are
// already persisted by whichever replica saved them, so they are returned
// as-is here rather than saved again.
async function refreshAndPersist(
    store: PatreonTokenStore,
    tokens: PatreonTokens,
    config: PatreonConfig,
): Promise<PatreonTokens> {
    try {
        const refreshed = await refreshTokens(tokens.refreshToken, config);
        await store.saveTokens(refreshed);
        return refreshed;
    } catch (err) {
        const current = await store.getTokens();
        if (current && current.accessToken !== tokens.accessToken) {
            return current;
        }
        throw err;
    }
}

// Patreon's post.attributes.url is a SITE-RELATIVE path ("/creator/posts/...")
// rather than an absolute URL — confirmed against a live response, not just
// docs. Used as-is, an <a href> on the landing page resolves it against
// nutrition-mcp.com instead of patreon.com, silently 404ing. Already-absolute
// values (if Patreon ever changes this) pass through unchanged.
function absolutePostUrl(url: string): string {
    return url.startsWith("http") ? url : `${PATREON_ORIGIN}${url}`;
}

// See TAG_MARKER above for why this is a text convention rather than a real
// API filter. Checked against both title and body — the creator may put it
// in either.
function hasTagMarker(post: PatreonPostAttributes): boolean {
    return `${post.title} ${post.content}`.toLowerCase().includes(TAG_MARKER);
}

// Patreon's `content` is post-authored HTML, not plain text. Block-level
// tags are turned into a space FIRST so "<p>Foo</p><p>Bar</p>" reads as
// "Foo Bar" rather than "FooBar" once every remaining tag is stripped.
function htmlToText(html: string): string {
    return html
        .replace(/<\/?(p|br|li|div|h[1-6]|hr)\b[^>]*>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#0*39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim();
}

// A short plain-text excerpt for the landing page. The tag marker is a
// filter signal for us, not something a reader should see in the excerpt, so
// it's stripped before truncating. Cuts at a word boundary rather than
// mid-word.
function buildPreview(content: string): string {
    const text = htmlToText(content)
        .replace(new RegExp(TAG_MARKER, "gi"), "")
        .replace(/\s+/g, " ")
        .trim();
    if (text.length <= PREVIEW_MAX_CHARS) return text;
    const cut = text.slice(0, PREVIEW_MAX_CHARS);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : PREVIEW_MAX_CHARS)}…`;
}

// A valid access token, refreshing proactively when the stored one is within
// REFRESH_MARGIN_MS of expiry. Returns null when nothing has been
// authorized/seeded yet — the caller (getRecentPosts) treats that as "no
// posts available", not an error. Throws if a needed refresh fails rather
// than silently returning the stale token — see refreshInFlight above for why
// retrying with a burnt token is worse than failing loudly here — except when
// refreshAndPersist's recovery branch finds another replica already
// refreshed, in which case that recovered token is used instead of failing.
// refreshInFlight IS the refreshAndPersist call, so every caller here just
// awaits the same promise and reads its result; saveTokens happens exactly
// once per refresh cycle, inside refreshAndPersist itself, never here.
async function getValidAccessToken(
    store: PatreonTokenStore,
    config: PatreonConfig,
): Promise<string | null> {
    const tokens = await store.getTokens();
    if (!tokens) return null;

    const expiresAt = new Date(tokens.expiresAt).getTime();
    if (expiresAt - Date.now() > REFRESH_MARGIN_MS) {
        return tokens.accessToken;
    }

    if (!refreshInFlight) {
        refreshInFlight = refreshAndPersist(store, tokens, config).finally(
            () => {
                refreshInFlight = null;
            },
        );
    }
    const refreshed = await refreshInFlight;
    return refreshed.accessToken;
}

/**
 * Up to MAX_POSTS of the creator's recent public Patreon posts about
 * Nutrition MCP specifically (public AND tag-marked, see TAG_MARKER), newest
 * first. Returns [] rather than throwing when nothing has been authorized
 * yet (see getValidAccessToken); any other failure (refresh failure, non-2xx
 * posts response, network error) propagates as a thrown Error — it is the
 * caller's job (src/index.ts) to catch that and degrade to [] for the
 * landing page.
 */
export async function getRecentPosts(
    store: PatreonTokenStore,
    config: PatreonConfig,
): Promise<PatreonPost[]> {
    const accessToken = await getValidAccessToken(store, config);
    if (!accessToken) return [];

    const url =
        `${POSTS_URL_BASE}/${config.campaignId}/posts` +
        `?fields[post]=title,content,url,published_at,is_public,is_paid&sort=-published_at`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
        throw new Error(`Patreon posts request failed: ${res.status}`);
    }
    const body = (await res.json()) as PatreonPostsResponse;

    // is_public is Patreon's own "safe to show everyone" signal. is_paid is
    // orthogonal and must NOT be used as a stronger gate — a post can be both
    // public and paid-tier-flagged. hasTagMarker is the separate "is this
    // post actually about Nutrition MCP" gate — see TAG_MARKER above.
    //
    // The API is asked to sort by -published_at already; sorting again here
    // is cheap and removes a dependency on the API actually honoring that
    // param.
    const publicPosts = (body.data ?? []).filter(
        (post) => post.attributes.is_public === true,
    );
    const taggedPosts = publicPosts.filter((post) =>
        hasTagMarker(post.attributes),
    );

    // publicPosts.length > 0 but nothing survived the tag filter means the
    // creator likely forgot to mark a post — the only symptom otherwise is
    // the landing-page strip going quietly stale, with nothing pointing a
    // maintainer at why. Zero public posts at all is unremarkable and not
    // logged here.
    if (publicPosts.length > 0 && taggedPosts.length === 0) {
        console.warn(
            `Patreon: ${publicPosts.length} public post(s) had no ${TAG_MARKER} tag marker; check whether a post was left untagged.`,
        );
    }

    return taggedPosts
        .sort((a, b) =>
            b.attributes.published_at.localeCompare(a.attributes.published_at),
        )
        .slice(0, MAX_POSTS)
        .map((post) => ({
            title: post.attributes.title,
            preview: buildPreview(post.attributes.content),
            url: absolutePostUrl(post.attributes.url),
            publishedAt: post.attributes.published_at,
        }));
}
