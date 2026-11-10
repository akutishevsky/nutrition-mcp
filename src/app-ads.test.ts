import { describe, expect, test } from "bun:test";

// app-ads.txt (ADS-FOUNDATION, Amendment G item 3): Google requires the
// publisher line at https://munch.business/app-ads.txt so AdMob can
// verify the app. The file content is exact — a single line naming the
// Munch publisher account — and src/index.ts serves it as text/plain
// following the robots.txt pattern.
const EXPECTED_LINE =
    "google.com, pub-2708638041809482, DIRECT, f08c47fec0942fa0";

describe("app-ads.txt route content", () => {
    test("the public file contains exactly the publisher line", async () => {
        const content = await Bun.file("./public/app-ads.txt").text();
        expect(content).toBe(`${EXPECTED_LINE}\n`);
    });

    test("the server registers /app-ads.txt as a text/plain route", async () => {
        const server = await Bun.file("./src/index.ts").text();
        expect(server).toContain('app.get("/app-ads.txt"');
        expect(server).toContain('"./public/app-ads.txt"');
        expect(server).toContain('"Content-Type": "text/plain');
    });
});
