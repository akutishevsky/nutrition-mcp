import { test, expect } from "bun:test";

// The SEO "alternative to X" routes are wired data-driven in index.ts via the
// ALT_PAGES map, and each path is also listed in sitemap.xml. A typo in either
// place ships a route that 500s at request time or a page Google never sees.
// Parse the map straight from the source (no import — index.ts has top-level
// side effects) and assert both stay consistent with what's on disk.

const src = await Bun.file("./src/index.ts").text();
const block = src.match(/const ALT_PAGES[^}]*\}/s)?.[0] ?? "";
const entries = [...block.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map((m) => ({
    route: m[1],
    file: m[2],
}));

test("ALT_PAGES is non-empty and parsed", () => {
    expect(entries.length).toBeGreaterThan(0);
});

test("every ALT_PAGES route maps to a non-empty public file", async () => {
    for (const { route, file } of entries) {
        const f = Bun.file(`./public/${file}`);
        expect(await f.exists(), `${route} -> public/${file} is missing`).toBe(
            true,
        );
        expect(f.size, `public/${file} is empty`).toBeGreaterThan(0);
    }
});

test("every ALT_PAGES route is listed in sitemap.xml", async () => {
    const sitemap = await Bun.file("./public/sitemap.xml").text();
    for (const { route } of entries) {
        expect(sitemap, `${route} missing from sitemap.xml`).toContain(
            `https://nutrition-mcp.com${route}`,
        );
    }
});
