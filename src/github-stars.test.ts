import { test, expect, describe } from "bun:test";

import {
    GITHUB_REPO,
    createStarCounter,
    fetchStarCount,
} from "./github-stars.js";

describe("fetchStarCount", () => {
    test("reads stargazers_count from the repo endpoint", async () => {
        let url = "";
        const n = await fetchStarCount(async (u) => {
            url = u;
            return Response.json({ stargazers_count: 42 });
        });
        expect(n).toBe(42);
        expect(url).toBe(`https://api.github.com/repos/${GITHUB_REPO}`);
    });

    test("throws on a non-2xx and on a body without a count", async () => {
        await expect(
            fetchStarCount(
                async () => new Response("rate limited", { status: 403 }),
            ),
        ).rejects.toThrow("403");
        await expect(
            fetchStarCount(async () => Response.json({ message: "x" })),
        ).rejects.toThrow();
    });

    test("gives up after the timeout instead of hanging", async () => {
        const started = Date.now();
        await expect(
            fetchStarCount(
                (_u, init) =>
                    new Promise((_resolve, reject) => {
                        init?.signal?.addEventListener("abort", () =>
                            reject(init.signal!.reason),
                        );
                    }),
                20,
            ),
        ).rejects.toThrow();
        expect(Date.now() - started).toBeLessThan(1000);
    });
});

describe("createStarCounter", () => {
    test("caches a success for the TTL, then refetches", async () => {
        let t = 0;
        let calls = 0;
        const get = createStarCounter({
            fetchStars: async () => ++calls * 10,
            ttlMs: 100,
            retryMs: 10,
            now: () => t,
        });
        expect(await get()).toBe(10);
        t = 99;
        expect(await get()).toBe(10);
        expect(calls).toBe(1);
        t = 100;
        expect(await get()).toBe(20);
        expect(calls).toBe(2);
    });

    test("a failure with nothing cached is null, and is not retried until retryMs", async () => {
        let t = 0;
        let calls = 0;
        let fail = true;
        const get = createStarCounter({
            fetchStars: async () => {
                calls++;
                if (fail) throw new Error("down");
                return 7;
            },
            ttlMs: 1000,
            retryMs: 50,
            now: () => t,
        });
        expect(await get()).toBeNull();
        t = 49;
        expect(await get()).toBeNull();
        expect(calls).toBe(1);
        fail = false;
        t = 50;
        expect(await get()).toBe(7);
        expect(calls).toBe(2);
    });

    test("a failed refresh keeps serving the last good count", async () => {
        let t = 0;
        let fail = false;
        const get = createStarCounter({
            fetchStars: async () => {
                if (fail) throw new Error("down");
                return 5;
            },
            ttlMs: 10,
            retryMs: 10,
            now: () => t,
        });
        expect(await get()).toBe(5);
        fail = true;
        t = 10;
        expect(await get()).toBe(5);
    });

    test("concurrent callers share one request", async () => {
        let calls = 0;
        let release!: (n: number) => void;
        const get = createStarCounter({
            fetchStars: () => {
                calls++;
                return new Promise<number>((r) => (release = r));
            },
        });
        const a = get();
        const b = get();
        release(3);
        expect(await Promise.all([a, b])).toEqual([3, 3]);
        expect(calls).toBe(1);
    });
});
