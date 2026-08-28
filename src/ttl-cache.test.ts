import { test, expect, mock, describe } from "bun:test";
import { createTtlCache } from "./ttl-cache.js";

describe("createTtlCache", () => {
    test("serves from cache within the TTL window, refetches after it expires", async () => {
        const fetcher = mock(() => Promise.resolve("v1"));
        const get = createTtlCache(10, fetcher);

        expect(await get()).toEqual({ data: "v1", stale: false });
        expect(await get()).toEqual({ data: "v1", stale: false });
        expect(fetcher).toHaveBeenCalledTimes(1);

        // Cross the (short) TTL with a real timer rather than mocking Date.now.
        await new Promise((r) => setTimeout(r, 20));

        fetcher.mockImplementation(() => Promise.resolve("v2"));
        expect(await get()).toEqual({ data: "v2", stale: false });
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    test("coalesces concurrent callers onto a single in-flight fetch", async () => {
        let resolveFetch!: (value: string) => void;
        const fetcher = mock(
            () =>
                new Promise<string>((resolve) => {
                    resolveFetch = resolve;
                }),
        );
        const get = createTtlCache(1000, fetcher);

        const first = get();
        const second = get();
        resolveFetch("v1");

        expect(await first).toEqual({ data: "v1", stale: false });
        expect(await second).toEqual({ data: "v1", stale: false });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });

    test("serves the last-good value with stale:true when the fetcher fails", async () => {
        const fetcher = mock(() => Promise.resolve("v1"));
        const get = createTtlCache(10, fetcher);
        expect(await get()).toEqual({ data: "v1", stale: false });

        await new Promise((r) => setTimeout(r, 20));
        fetcher.mockImplementation(() => Promise.reject(new Error("boom")));

        expect(await get()).toEqual({ data: "v1", stale: true });
    });

    test("rejects when the fetcher fails and nothing has ever been cached", async () => {
        const fetcher = mock(() => Promise.reject(new Error("boom")));
        const get = createTtlCache(1000, fetcher);

        await expect(get()).rejects.toThrow("boom");
    });
});
