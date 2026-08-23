/**
 * Generates public/sitemap.xml from src/routes.ts's PAGE_ROUTES/LOCALES —
 * it used to be a hand-maintained static file, edited alongside content
 * changes. Now that pages exist in up to 8 locales each, hand-editing would
 * mean keeping ~88 possible URLs and their reciprocal hreflang annotations
 * in sync by eye, which is exactly the kind of mechanical bookkeeping this
 * generator family exists to replace (see scripts/gen-alternatives.ts).
 *
 * Only emits a <url> for a locale/page pair whose file actually exists on
 * disk (public/{locale}/{file}, or public/{file} for English) — an entry
 * here is a promise to crawlers, and listing a page that 500s because its
 * translation hasn't landed yet would be actively harmful, not premature
 * optimization.
 *
 * hreflang is annotated in the sitemap itself (in addition to, not instead
 * of, the per-page <link rel="alternate"> tags scripts/site-partials.ts's
 * localeHead() already emits — Google's own guidance is to do both) via the
 * xhtml:link extension, computed from whichever locale/page pairs actually
 * exist rather than the full LOCALES list, so it can never claim a sibling
 * that isn't really there.
 *
 * Re-run after regenerating any page:
 *   bun run scripts/gen-sitemap.ts
 */

import {
    PAGE_ROUTES,
    SITE_LOCALES,
    urlFor,
    type SiteLocale,
} from "../src/routes.js";

// Per-page-type crawl hints, unchanged from the site's original hand-written
// sitemap. Keyed by PAGE_ROUTES suffix.
const CHANGEFREQ: Record<string, string> = {
    "": "weekly",
    "/tools": "monthly",
    "/privacy": "yearly",
    "/terms": "yearly",
};
const PRIORITY: Record<string, string> = {
    "": "1.0",
    "/tools": "0.8",
    "/privacy": "0.3",
    "/terms": "0.3",
};
// Comparison pages and the /alternatives hub aren't in the maps above (their
// suffixes are data-driven from ALT_PAGES, not hand-listed) — the hub gets
// its own priority, every comparison page shares one.
function changefreqFor(suffix: string): string {
    return CHANGEFREQ[suffix] ?? "monthly";
}
function priorityFor(suffix: string): string {
    if (suffix in PRIORITY) return PRIORITY[suffix]!;
    return suffix === "/alternatives" ? "0.7" : "0.8";
}

// A page's <lastmod>. Pinned per suffix rather than read from filesystem
// mtime: mtime would bump on every unrelated regeneration (formatting,
// shared-partial edits) and turn <lastmod> into noise instead of a signal.
// Bump an entry here by hand when that page's real content changes.
const LASTMOD: Record<string, string> = {
    "": "2026-07-25",
    "/tools": "2026-07-25",
    "/privacy": "2026-07-23",
    "/terms": "2026-07-23",
};
function lastmodFor(suffix: string): string {
    return LASTMOD[suffix] ?? "2026-08-23";
}

async function fileFor(locale: SiteLocale, file: string): Promise<string> {
    return locale === "en" ? `./public/${file}` : `./public/${locale}/${file}`;
}

type Entry = { locale: SiteLocale; suffix: string; url: string };

const entries: Entry[] = [];
for (const [suffix, file] of Object.entries(PAGE_ROUTES)) {
    for (const locale of SITE_LOCALES) {
        if (await Bun.file(await fileFor(locale, file)).exists()) {
            entries.push({ locale, suffix, url: urlFor(locale, suffix) });
        }
    }
}

// Group by suffix so hreflang siblings are only ever real, existing pages.
const bySuffix = new Map<string, Entry[]>();
for (const e of entries) {
    const list = bySuffix.get(e.suffix) ?? [];
    list.push(e);
    bySuffix.set(e.suffix, list);
}

function urlBlock(e: Entry): string {
    const siblings = bySuffix.get(e.suffix) ?? [];
    const hreflang = siblings
        .map(
            (s) =>
                `        <xhtml:link rel="alternate" hreflang="${s.locale}" href="${s.url}" />`,
        )
        .join("\n");
    // x-default only makes sense once the English page exists — true for
    // every page type today, but guarded rather than assumed.
    const en = siblings.find((s) => s.locale === "en");
    const xDefault = en
        ? `\n        <xhtml:link rel="alternate" hreflang="x-default" href="${en.url}" />`
        : "";
    return `    <url>
        <loc>${e.url}</loc>
${hreflang}${xDefault}
        <lastmod>${lastmodFor(e.suffix)}</lastmod>
        <changefreq>${changefreqFor(e.suffix)}</changefreq>
        <priority>${priorityFor(e.suffix)}</priority>
    </url>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
    xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.map(urlBlock).join("\n")}
</urlset>
`;

await Bun.write("./public/sitemap.xml", xml);
console.log(`wrote sitemap.xml (${entries.length} URLs)`);
