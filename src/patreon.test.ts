import {
    test,
    expect,
    mock,
    spyOn,
    beforeEach,
    afterEach,
    describe,
} from "bun:test";
import {
    getRecentPosts,
    type PatreonConfig,
    type PatreonTokenStore,
    type PatreonTokens,
} from "./patreon.js";

const realFetch = globalThis.fetch;

const CONFIG: PatreonConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    campaignId: "camp123",
};

class FakeStore implements PatreonTokenStore {
    saved: PatreonTokens[] = [];
    constructor(private tokens: PatreonTokens | null) {}
    async getTokens(): Promise<PatreonTokens | null> {
        return this.tokens;
    }
    async saveTokens(tokens: PatreonTokens): Promise<void> {
        this.tokens = tokens;
        this.saved.push(tokens);
    }
}

/** Like FakeStore, but getTokens() returns `first` on its first call and
 *  `after` on every call thereafter — simulating another replica completing
 *  its own refresh between this process's initial read and its recovery
 *  re-read after a failed refresh attempt. */
class SwappingFakeStore implements PatreonTokenStore {
    saved: PatreonTokens[] = [];
    private calls = 0;
    constructor(
        private first: PatreonTokens,
        private after: PatreonTokens,
    ) {}
    async getTokens(): Promise<PatreonTokens | null> {
        this.calls++;
        return this.calls === 1 ? this.first : this.after;
    }
    async saveTokens(tokens: PatreonTokens): Promise<void> {
        this.saved.push(tokens);
    }
}

function freshTokens(minutesUntilExpiry: number): PatreonTokens {
    return {
        accessToken: "access-old",
        refreshToken: "refresh-old",
        expiresAt: new Date(
            Date.now() + minutesUntilExpiry * 60 * 1000,
        ).toISOString(),
    };
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

interface PostFixture {
    id: string;
    title: string;
    url: string;
    published_at: string;
    is_public: boolean;
    is_paid?: boolean;
    content?: string;
}

// Every fixture is tag-marked by default so tests about is_public/sort/cap/
// url-normalization aren't incidentally exercising the tag filter too — only
// tests that pass their own `content` (or an unmarked one) test that.
const DEFAULT_CONTENT = "Update body. #nutrition-mcp";

function postsBody(posts: PostFixture[]) {
    return {
        data: posts.map((p) => ({
            id: p.id,
            type: "post",
            attributes: {
                title: p.title,
                content: p.content ?? DEFAULT_CONTENT,
                url: p.url,
                published_at: p.published_at,
                is_public: p.is_public,
                is_paid: p.is_paid ?? false,
            },
        })),
    };
}

function defaultTokenRefreshBody() {
    return {
        access_token: "access-new",
        refresh_token: "refresh-new",
        expires_in: 3600,
    };
}

/** Stubs global.fetch, routing Patreon's token endpoint and posts endpoint to
 *  separate handlers and counting calls to each — the token-call count is
 *  what the single-flight tests assert on. */
function mockFetch(opts: {
    posts: PostFixture[];
    tokenStatus?: number;
    tokenBody?: unknown;
}) {
    let tokenCalls = 0;
    let postCalls = 0;
    const authHeaders: string[] = [];
    globalThis.fetch = mock(
        (input: string | URL | Request, init?: RequestInit) => {
            const url = String(input);
            if (url.includes("/oauth2/token")) {
                tokenCalls++;
                return Promise.resolve(
                    jsonResponse(
                        opts.tokenBody ?? defaultTokenRefreshBody(),
                        opts.tokenStatus ?? 200,
                    ),
                );
            }
            postCalls++;
            const auth = (init?.headers as Record<string, string> | undefined)
                ?.Authorization;
            if (auth) authHeaders.push(auth);
            return Promise.resolve(jsonResponse(postsBody(opts.posts)));
        },
    ) as unknown as typeof fetch;
    return {
        tokenCallCount: () => tokenCalls,
        postCallCount: () => postCalls,
        authHeaders,
    };
}

afterEach(() => {
    globalThis.fetch = realFetch;
});

describe("getRecentPosts", () => {
    test("filters out posts with is_public === false", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Public post",
                    url: "https://patreon.com/posts/1",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                },
                {
                    id: "2",
                    title: "Paid-only post",
                    url: "https://patreon.com/posts/2",
                    published_at: "2026-08-21T00:00:00Z",
                    is_public: false,
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts).toHaveLength(1);
        expect(posts[0]!.title).toBe("Public post");
    });

    test("a public post flagged is_paid is still included", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Public + paid-flagged post",
                    url: "https://patreon.com/posts/1",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                    is_paid: true,
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts).toHaveLength(1);
    });

    test("sorts by published_at desc even when the API returns unsorted", async () => {
        mockFetch({
            posts: [
                {
                    id: "old",
                    title: "Older",
                    url: "https://patreon.com/posts/old",
                    published_at: "2026-01-01T00:00:00Z",
                    is_public: true,
                },
                {
                    id: "new",
                    title: "Newer",
                    url: "https://patreon.com/posts/new",
                    published_at: "2026-08-01T00:00:00Z",
                    is_public: true,
                },
                {
                    id: "mid",
                    title: "Middle",
                    url: "https://patreon.com/posts/mid",
                    published_at: "2026-04-01T00:00:00Z",
                    is_public: true,
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts.map((p) => p.title)).toEqual(["Newer", "Middle", "Older"]);
    });

    test("caps to 12 posts even when the API returns more", async () => {
        const posts15: PostFixture[] = Array.from({ length: 15 }, (_, i) => ({
            id: String(i),
            title: `Post ${i}`,
            url: `https://patreon.com/posts/${i}`,
            published_at: new Date(2026, 0, i + 1).toISOString(),
            is_public: true,
        }));
        mockFetch({ posts: posts15 });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts).toHaveLength(12);
        // The 12 newest (highest date) should have survived the cap.
        expect(posts.map((p) => p.title)).toEqual([
            "Post 14",
            "Post 13",
            "Post 12",
            "Post 11",
            "Post 10",
            "Post 9",
            "Post 8",
            "Post 7",
            "Post 6",
            "Post 5",
            "Post 4",
            "Post 3",
        ]);
    });

    // Confirmed against a live Patreon response: post.attributes.url is
    // site-relative ("/creator/posts/..."), not absolute. Used as-is, the
    // landing page's <a href> would resolve against nutrition-mcp.com instead
    // of patreon.com and silently 404 — this pins the fix (#absolutePostUrl).
    test("normalizes a site-relative post url to an absolute patreon.com link", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Relative-url post",
                    url: "/akutishevskyi/posts/relative-url-123",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts[0]?.url).toBe(
            "https://www.patreon.com/akutishevskyi/posts/relative-url-123",
        );
    });

    test("leaves an already-absolute post url unchanged", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Absolute-url post",
                    url: "https://patreon.com/posts/absolute-123",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts[0]?.url).toBe("https://patreon.com/posts/absolute-123");
    });

    // The campaign covers more than one project, so Patreon's own is_public
    // signal alone isn't enough — see TAG_MARKER's doc comment in patreon.ts.
    test("filters out a public post with no #nutrition-mcp tag marker", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Nutrition MCP update",
                    url: "https://patreon.com/posts/1",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                    content: "About Nutrition MCP. #nutrition-mcp",
                },
                {
                    id: "2",
                    title: "Withings MCP update",
                    url: "https://patreon.com/posts/2",
                    published_at: "2026-08-21T00:00:00Z",
                    is_public: true,
                    content: "About a completely different project.",
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts.map((p) => p.title)).toEqual(["Nutrition MCP update"]);
    });

    test("matches the tag marker in the title alone", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "#nutrition-mcp: new release",
                    url: "https://patreon.com/posts/1",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                    content: "No marker here, but the title has it.",
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts).toHaveLength(1);
    });

    test("warns when public posts exist but none carry the tag marker", async () => {
        const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
        try {
            mockFetch({
                posts: [
                    {
                        id: "1",
                        title: "Withings MCP update",
                        url: "https://patreon.com/posts/1",
                        published_at: "2026-08-20T00:00:00Z",
                        is_public: true,
                        content: "About a completely different project.",
                    },
                ],
            });
            const store = new FakeStore(freshTokens(60));
            const posts = await getRecentPosts(store, CONFIG);
            expect(posts).toEqual([]);
            expect(warnSpy).toHaveBeenCalledTimes(1);
            expect(String(warnSpy.mock.calls[0]![0])).toContain("1");
        } finally {
            warnSpy.mockRestore();
        }
    });

    test("does not warn when there are simply no public posts at all", async () => {
        const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
        try {
            mockFetch({
                posts: [
                    {
                        id: "1",
                        title: "Paid-only post",
                        url: "https://patreon.com/posts/1",
                        published_at: "2026-08-20T00:00:00Z",
                        is_public: false,
                    },
                ],
            });
            const store = new FakeStore(freshTokens(60));
            await getRecentPosts(store, CONFIG);
            expect(warnSpy).not.toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    test("does not warn when tagged posts exist normally", async () => {
        const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
        try {
            mockFetch({
                posts: [
                    {
                        id: "1",
                        title: "Nutrition MCP update",
                        url: "https://patreon.com/posts/1",
                        published_at: "2026-08-20T00:00:00Z",
                        is_public: true,
                    },
                ],
            });
            const store = new FakeStore(freshTokens(60));
            await getRecentPosts(store, CONFIG);
            expect(warnSpy).not.toHaveBeenCalled();
        } finally {
            warnSpy.mockRestore();
        }
    });

    test("the tag marker match is case-insensitive", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Update",
                    url: "https://patreon.com/posts/1",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                    content: "Shouted at the end: #NUTRITION-MCP",
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts).toHaveLength(1);
    });

    test("preview strips HTML tags, collapses block breaks into spaces, and drops the tag marker", async () => {
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Update",
                    url: "https://patreon.com/posts/1",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                    content:
                        "<p>Two <strong>fixes</strong> shipped.</p><p>Details inside.</p> #nutrition-mcp",
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts[0]?.preview).toBe("Two fixes shipped. Details inside.");
    });

    test("preview truncates long content at a word boundary with an ellipsis", async () => {
        const word = "reliable";
        const longContent = `<p>${Array(40).fill(word).join(" ")}</p> #nutrition-mcp`;
        mockFetch({
            posts: [
                {
                    id: "1",
                    title: "Update",
                    url: "https://patreon.com/posts/1",
                    published_at: "2026-08-20T00:00:00Z",
                    is_public: true,
                    content: longContent,
                },
            ],
        });
        const store = new FakeStore(freshTokens(60));
        const posts = await getRecentPosts(store, CONFIG);
        const preview = posts[0]!.preview;
        expect(preview.endsWith("…")).toBe(true);
        expect(preview.length).toBeLessThanOrEqual(161); // 160 + the ellipsis
        expect(preview.includes(word.slice(0, -2) + "…")).toBe(false); // never cuts mid-word
    });

    test("does not refresh when the stored token is not near expiry", async () => {
        const fetches = mockFetch({ posts: [] });
        const store = new FakeStore(freshTokens(60));
        await getRecentPosts(store, CONFIG);
        expect(fetches.tokenCallCount()).toBe(0);
        expect(fetches.postCallCount()).toBe(1);
    });

    test("refreshes and persists new tokens when the stored token is near expiry", async () => {
        const fetches = mockFetch({ posts: [] });
        const store = new FakeStore(freshTokens(2)); // within the 5-minute margin
        await getRecentPosts(store, CONFIG);
        expect(fetches.tokenCallCount()).toBe(1);
        expect(store.saved).toHaveLength(1);
        expect(store.saved[0]!.accessToken).toBe("access-new");
        expect(store.saved[0]!.refreshToken).toBe("refresh-new");
        expect(fetches.authHeaders[0]).toBe("Bearer access-new");
    });

    test("refreshes when the stored token is already past expiry", async () => {
        const fetches = mockFetch({ posts: [] });
        const store = new FakeStore(freshTokens(-10));
        await getRecentPosts(store, CONFIG);
        expect(fetches.tokenCallCount()).toBe(1);
    });

    test("two concurrent calls needing a refresh trigger only one refresh POST", async () => {
        const fetches = mockFetch({ posts: [] });
        const store = new FakeStore(freshTokens(1));
        const [a, b] = await Promise.all([
            getRecentPosts(store, CONFIG),
            getRecentPosts(store, CONFIG),
        ]);
        expect(a).toEqual([]);
        expect(b).toEqual([]);
        expect(fetches.tokenCallCount()).toBe(1);
        expect(fetches.postCallCount()).toBe(2);
        // Only the refresh cycle itself saves — not each of the two waiters.
        expect(store.saved).toHaveLength(1);
    });

    test("recovers when another replica already refreshed the shared token", async () => {
        // Simulates a rolling redeploy: this process's refresh POST fails
        // (its refresh_token argument was already burned by another
        // replica), but a re-read of the shared store finds that replica's
        // already-persisted, not-near-expiry tokens.
        const recoveredTokens: PatreonTokens = {
            accessToken: "access-from-other-replica",
            refreshToken: "refresh-from-other-replica",
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
        const store = new SwappingFakeStore(freshTokens(1), recoveredTokens);
        const fetches = mockFetch({
            posts: [],
            tokenStatus: 401,
            tokenBody: { error: "x" },
        });
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts).toEqual([]);
        expect(fetches.authHeaders[0]).toBe("Bearer access-from-other-replica");
        // Recovered tokens were already persisted by the other replica —
        // this process must not save them again.
        expect(store.saved).toHaveLength(0);
    });

    test("returns [] when the store has no tokens (nothing seeded yet)", async () => {
        const fetches = mockFetch({ posts: [] });
        const store = new FakeStore(null);
        const posts = await getRecentPosts(store, CONFIG);
        expect(posts).toEqual([]);
        expect(fetches.tokenCallCount()).toBe(0);
        expect(fetches.postCallCount()).toBe(0);
    });

    test("throws when the refresh HTTP call fails", async () => {
        mockFetch({ posts: [], tokenStatus: 401, tokenBody: { error: "x" } });
        const store = new FakeStore(freshTokens(1));
        expect(getRecentPosts(store, CONFIG)).rejects.toThrow(
            "Patreon token refresh failed",
        );
    });

    test("throws when the posts request fails", async () => {
        globalThis.fetch = mock(() =>
            Promise.resolve(jsonResponse({ error: "nope" }, 500)),
        ) as unknown as typeof fetch;
        const store = new FakeStore(freshTokens(60));
        expect(getRecentPosts(store, CONFIG)).rejects.toThrow(
            "Patreon posts request failed",
        );
    });
});
