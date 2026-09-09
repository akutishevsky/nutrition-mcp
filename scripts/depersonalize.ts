#!/usr/bin/env bun
/**
 * depersonalize.ts — strip the maintainer's personal bits from the public
 * site so the project is clean to self-host.
 *
 *   bun run scripts/depersonalize.ts          # rewrite files in place
 *   bun run scripts/depersonalize.ts --dry    # report only, change nothing
 *
 * What it removes / neutralizes:
 *   - Google Analytics (gtag) from every public HTML page + the CSP allow-list
 *   - The Glama connector-ownership route (embeds the maintainer's email)
 *   - The landing page's Patreon "Support" section (incl. the latest-posts
 *     block + its fetch) and Contact section, and the nav / footer links
 *     into them
 *   - The shared header/footer chrome every page renders (nav()/footer() in
 *     scripts/site-partials.ts): the sheet-menu GitHub link, the footer's
 *     social icons (GitHub / Patreon / email), the Open-source column's repo
 *     sub-links, the "Support on Patreon" link, and the maintainer's handle
 *     in the footer blurb and copyright line
 *   - The landing page's hero + CTA "GitHub" buttons and the live star-count
 *     fetch
 *   - The support email embedded in the bulk-import widget
 *   - The nutrition-mcp.com domain -> your-domain.com placeholder
 *     (install/MCP URL, canonical/OG tags, sitemap, robots)
 *   - The "alternative to X" comparison pages under public/alternatives/
 *     (GA, GitHub/contact links, domain)
 *
 * It is tuned to the current markup. If a pattern stops matching after a
 * redesign, the run reports "0 matches" for that rule so you can spot it.
 * Re-running is safe (idempotent): already-clean rules simply report 0.
 *
 * public/*.html is generated, not checked into git — run `bun run gen:all`
 * first, or this has nothing to depersonalize on a fresh clone.
 *
 * NOT auto-handled (edit by hand if you want): marketing copy/tone, the
 * brand images (public/og.png, favicon.ico, apple-touch-icon.png), the
 * page <title>/meta description wording, and the alternatives-page generator
 * scripts/gen-alternatives.ts (update its SITE constant, GA tag, and
 * GitHub/contact links before regenerating).
 */

import { statSync } from "node:fs";

const PLACEHOLDER_DOMAIN = "your-domain.com";
const DRY = process.argv.includes("--dry");

type Rule = {
    name: string;
    find: RegExp;
    replace?: string;
    optional?: boolean;
};

/** Remove Google Analytics from any HTML page. */
const ANALYTICS_RULES: Rule[] = [
    {
        // Anchored on the loader's OWN opening tag (its src is the
        // googletagmanager URL), not on "the first <script> that is followed
        // by googletagmanager somewhere": every page's JSON-LD blocks sit
        // before the GA snippet in <head>, and a lazy [\s\S]*? from the
        // first <script> ate both of them along with the loader.
        name: "GA loader <script>",
        find: /[ \t]*<script\b[^>]*googletagmanager[^>]*>\s*<\/script>\n/,
    },
    {
        name: "GA inline config <script>",
        find: /[ \t]*<script>\s*window\.dataLayer[\s\S]*?<\/script>\n/,
    },
];

/** Every link to the maintainer's GitHub repo (nav, footer, CTA button). */
const GITHUB_LINKS_RULE: Rule = {
    name: "GitHub repo links (nav / footer / CTA)",
    find: /[ \t]*<a\b[^>]*?href="https:\/\/github\.com\/akutishevsky\/nutrition-mcp"[\s\S]*?<\/a\s*>\n/g,
};

/**
 * The shared footer() chrome (scripts/site-partials.ts), rendered on every
 * page since the whole site moved onto the Dawn design: the social circle
 * (GitHub / Patreon / Email — each an icon-only link on its own line) and
 * the repo sub-links (#self-hosting, /issues, /blob/main/LICENSE) that the
 * exact-href GITHUB_LINKS_RULE deliberately does not match. The bottom
 * line's Privacy / Terms / Alternatives stay. Each label is matched
 * with an optional <i> icon plus [^<]* (not [\s\S]*) so a link whose </a>
 * isn't followed by a newline can't run on and swallow everything up to the
 * next anchor. The footer's "Source on GitHub" link and the sheet menu's
 * "GitHub" item are GITHUB_LINKS_RULE's.
 */
const FOOTER_RULES: Rule[] = [
    {
        name: "footer: Patreon social icon link",
        find: /[ \t]*<a\b[^>]*?href="https:\/\/patreon\.com\/[^"]*"[^>]*>(?:<i\b[^>]*><\/i>)?[^<]*<\/a\s*>\n/g,
    },
    {
        name: "footer: Email (mailto) icon link",
        find: /[ \t]*<a\b[^>]*?href="mailto:anton@nutrition-mcp\.com"[^>]*>(?:<i\b[^>]*><\/i>)?[^<]*<\/a\s*>\n/g,
    },
    {
        name: "footer: GitHub repo sub-links (readme / issues / licence)",
        find: /[ \t]*<a\b[^>]*?href="https:\/\/github\.com\/akutishevsky\/nutrition-mcp[#/][^"]*"[^>]*>[^<]*<\/a\s*>\n/g,
    },
];

/**
 * The maintainer's handle in the footer blurb and the copyright line.
 * Locale-agnostic on purpose: the handle is the one token every locale
 * renders verbatim, so it is swapped for a placeholder rather than the
 * sentence being rewritten — fix the grammar by hand if it reads oddly. The
 * lookahead keeps it off repo URLs ("akutishevsky/nutrition-mcp"), which the
 * link rules delete whole.
 */
const HANDLE_RULE: Rule = {
    name: "footer: maintainer handle -> placeholder",
    find: /\bakutishevsky\b(?![\w/-])/g,
    replace: "your-name",
};

/**
 * The one inline mailto in prose (the hub's "Request a comparison" sentence)
 * -> plain text. The label is translated per locale, so it is captured
 * rather than hardcoded; (?!\n) keeps this off the footer's icon link, which
 * sits alone on its own line and is deleted whole by FOOTER_RULES instead.
 */
const HUB_MAILTO_RULE: Rule = {
    name: "hub: inline 'Request a comparison' mailto -> text",
    find: /<a\b[^>]*?href="mailto:anton@nutrition-mcp\.com"[^>]*>([^<]*)<\/a\s*>(?!\n)/,
    replace: "$1",
    optional: true, // hub-only; absent from the per-app pages
};

/**
 * Nav / footer links to the Support/Contact sections we're deleting. nav()
 * and footer() are shared chrome, so these render on every page (the
 * header pills, the sheet menu and the footer's Product column), not
 * just the landing page. hashPath() prefixes a locale-aware path
 * ("/#support" in English, "/de#support" in German, ...) and the label is
 * translated per locale, so match on the hash target only and capture-drop
 * the label rather than hardcoding either.
 */
const NAV_SUPPORT_RULE: Rule = {
    name: "nav: Support link",
    find: /[ \t]*<a href="[^"]*#support">[^<]*<\/a>\n/g,
};
const NAV_CONTACT_RULE: Rule = {
    name: "nav: Contact link",
    find: /[ \t]*<a href="[^"]*#contact">[^<]*<\/a>\n/g,
};

/**
 * Everything personal in the shared nav()/footer() chrome, in the order the
 * rules must run: the exact-href GITHUB_LINKS_RULE goes after the footer
 * sub-link rule (it wouldn't match those anyway, but keeping the specific
 * rule first keeps the counts honest), and the handle swap last. A page with
 * its own prose links (terms, the alternatives hub, the landing FAQ) unwraps
 * those to text BEFORE this bundle, so the whole-line sweeps can't gut a
 * sentence.
 */
const CHROME_RULES: Rule[] = [
    NAV_SUPPORT_RULE,
    NAV_CONTACT_RULE,
    ...FOOTER_RULES,
    GITHUB_LINKS_RULE,
    HANDLE_RULE,
];

/**
 * Personal content that only lives in the landing page (the 6a "Dawn"
 * design, scripts/gen-index.ts) on top of the shared chrome: the Support
 * and Contact sections, the hero / CTA-band GitHub buttons, and the two
 * inline fetch scripts. Sections are matched by `id="…"` (there are no
 * <!-- Support --> comments any more), script blocks by their
 * `// ---------- … ----------` banner comments.
 */
const LANDING_RULES: Rule[] = [
    // Rewrite prose links first so the generic sweeps can't gut a sentence.
    {
        // The FAQ's "Can I self-host it?" answer links the repo mid-sentence.
        // The anchor text itself is already translated per locale (e.g. DE
        // "GitHub-Repository"), so this captures it rather than hardcoding
        // the English label — only the href/attributes are locale-constant.
        // (?!\n) keeps it off the sheet-menu "GitHub" and footer "Source on
        // GitHub" links, which sit alone on a line and are deleted whole by
        // GITHUB_LINKS_RULE below instead of being left as dangling text.
        name: "FAQ 'GitHub repository' prose link -> plain text",
        find: /<a\b[^>]*href="https:\/\/github\.com\/akutishevsky\/nutrition-mcp"[^>]*>([^<]*)<\/a\s*>(?!\n)/,
        replace: "$1",
    },
    {
        // The FAQ side column's "Anything missing? Ask me directly." links
        // to the Contact section this file deletes. Same shape as above:
        // unwrap to text (translated label captured), scoped by (?!\n) so
        // the whole-line #contact links stay NAV_CONTACT_RULE's.
        name: "FAQ 'Ask me directly' link -> plain text",
        find: /<a href="[^"]*#contact">([^<]*)<\/a\s*>(?!\n)/,
        replace: "$1",
    },
    {
        // English-only: this sentence ("Is Nutrition MCP free?") has no
        // stable wrapper/class to key on in the other 8 locales' FAQ prose
        // (different words, different order), so it can't be matched
        // structurally. It is matched globally so the JSON-LD twin of the
        // answer loses it too. 0 matches on a translated
        // public/{locale}/index.html is expected, not a warning sign — strip
        // it by hand there if self-hosting a translated page.
        name: "FAQ Patreon donation sentence",
        find: /\s*Patreon donations cover the server bill\./g,
        replace: "",
        optional: true,
    },
    // Whole Support (Patreon, incl. #patreon-updates and its <template>) and
    // Contact sections. Neither nests another <section>, so the first
    // </section> after the opening tag is the right one. They go before the
    // chrome bundle so the footer Patreon rule's count only reflects the
    // footer.
    {
        name: "section: Support (Patreon)",
        find: /[ \t]*<section\b[^>]*\bid="support"[^>]*>[\s\S]*?<\/section>\n/,
    },
    {
        name: "section: Contact",
        find: /[ \t]*<section\b[^>]*\bid="contact"[^>]*>[\s\S]*?<\/section>\n/,
    },
    // Shared header/footer chrome. On this page GITHUB_LINKS_RULE also takes
    // the hero "GitHub" button and the CTA band's "Star on GitHub"; those
    // multi-line buttons carry a [data-gh-stars] span, which is why the
    // star-count script below can go.
    ...CHROME_RULES,
    // The live star-count fetch (its target spans were in the buttons above).
    {
        name: "live GitHub star-count script",
        find: /[ \t]*\/\/ -+ live GitHub star count -+\n[\s\S]*?\.catch\(function \(\) \{\}\);\n[ \t]*\}\n/,
    },
    // The latest-Patreon-posts fetch. Its target block (#patreon-updates) and
    // the <template> it clones live inside the "section: Support (Patreon)"
    // HTML this file already strips wholesale above, so only the script needs
    // its own rule here.
    {
        name: "latest Patreon posts script",
        find: /[ \t]*\/\/ -+ latest Patreon posts -+\n[\s\S]*?\.catch\(function \(\) \{\}\);\n[ \t]*\}\n/,
    },
];

/**
 * The Glama connector-ownership route (`/.well-known/glama.json`) exists only to
 * claim the maintainer's Glama listing and hard-codes their email, so drop the
 * whole handler. Matches the comment through the route's closing `});` and the
 * trailing blank line, leaving the surrounding routes intact.
 */
const GLAMA_RULE: Rule = {
    name: "Glama connector-ownership route",
    find: /[ \t]*\/\/ Glama connector ownership verification\.[\s\S]*?app\.get\("\/\.well-known\/glama\.json"[\s\S]*?\n\}\);\n\n/,
};

/** Tighten the Content-Security-Policy: drop GA + GitHub API hosts. */
const CSP_RULES: Rule[] = [
    {
        name: "CSP: connect-src GA + github hosts",
        find: / https:\/\/www\.google-analytics\.com https:\/\/\*\.google-analytics\.com https:\/\/\*\.analytics\.google\.com https:\/\/analytics\.google\.com https:\/\/www\.google\.com https:\/\/\*\.googletagmanager\.com https:\/\/api\.github\.com/,
        replace: "",
    },
    {
        name: "CSP: googletagmanager host (script-src + img-src)",
        find: / https:\/\/www\.googletagmanager\.com/g,
        replace: "",
    },
];

const DOMAIN_RULE: Rule = {
    name: `domain nutrition-mcp.com -> ${PLACEHOLDER_DOMAIN}`,
    find: /nutrition-mcp\.com/g,
    replace: PLACEHOLDER_DOMAIN,
    optional: true, // absent from some pages; 0 matches there is fine
};

/**
 * Every non-landing page: GA, the shared chrome, the domain. Page-specific
 * prose links (terms, the alternatives hub) get their own unwrap rule ahead
 * of the chrome bundle. Mailto rules run before DOMAIN_RULE so the email is
 * removed before the domain sweep could rewrite it to a placeholder address.
 */
const PAGE_RULES: Rule[] = [...ANALYTICS_RULES, ...CHROME_RULES, DOMAIN_RULE];

// The generated "alternative to X" comparison pages carry the same personal
// bits as every other page plus the hub's inline "Request a comparison"
// mailto, which is unwrapped to text first so the footer email rule (a
// whole-line delete) can't over-match across tags.
const ALT_RULES: Rule[] = [
    ...ANALYTICS_RULES,
    HUB_MAILTO_RULE,
    ...CHROME_RULES,
    DOMAIN_RULE,
];

// Terms page. Its GitHub link and contact mailto sit mid-sentence, so the
// generic GITHUB_LINKS_RULE / footer email rule (which delete the whole anchor
// line) would leave dangling prose — unwrap them to text instead, scoped so
// they don't also swallow the footer/sheet-menu "GitHub" / email links, which
// the chrome bundle handles instead. The footer and sheet menu render a
// same-labeled "GitHub" link, but always immediately followed by a newline
// (each sits alone on its own line) where the prose mention is followed by
// more sentence text — (?!\n) tells them apart. The mailto rule is scoped the
// same way, by anchor text: the prose link's visible text is the email address
// itself, unlike the footer's icon link.
const TERMS_RULES: Rule[] = [
    ...ANALYTICS_RULES,
    {
        name: "terms: 'GitHub' prose link -> plain text",
        find: /<a\b[^>]*href="https:\/\/github\.com\/akutishevsky\/nutrition-mcp"[^>]*>GitHub<\/a\s*>(?!\n)/,
        replace: "GitHub",
    },
    {
        name: "terms: contact mailto -> placeholder address",
        find: /<a\b[^>]*?href="mailto:anton@nutrition-mcp\.com"[^>]*>anton@nutrition-mcp\.com<\/a\s*>/,
        replace: "your@email.com",
    },
    ...CHROME_RULES,
    DOMAIN_RULE,
];

const INDEX_RULES: Rule[] = [...ANALYTICS_RULES, ...LANDING_RULES, DOMAIN_RULE];

// Every comparison page under public/alternatives/, discovered at run time so a
// newly generated app page is depersonalized without editing this list.
/**
 * The import widget's support contact. It is JS, not markup, so the HTML-tuned
 * rules above do not apply: blank the constant rather than deleting it, because
 * every call site guards on it being non-empty and removing the declaration
 * would throw a ReferenceError inside the widget.
 */
const WIDGET_SUPPORT_RULE: Rule = {
    name: "import widget: support email -> empty",
    find: /(\/\* support-contact:start \*\/\s*\n\s*const SUPPORT_EMAIL = )"[^"]*"/,
    replace: '$1""',
};

const altPageJobs = (
    await Array.fromAsync(
        new Bun.Glob("*.html").scan({ cwd: "public/alternatives" }),
    )
)
    .sort()
    .map((f) => ({ path: `public/alternatives/${f}`, rules: ALT_RULES }));

// Rules per page filename, shared by the English pages at public/<file> and
// the translated mirrors at public/{locale}/<file> so the two can't drift.
const RULES_BY_FILENAME: Record<string, Rule[]> = {
    "login.html": PAGE_RULES,
    "privacy.html": PAGE_RULES,
    "terms.html": TERMS_RULES,
    "tools.html": PAGE_RULES,
    "index.html": INDEX_RULES,
};

// Translated site: public/{locale}/{index,tools,privacy,terms,login}.html and
// public/{locale}/alternatives/*.html. Discovered at run time the same way
// altPageJobs is, rather than hand-listing every locale: a locale directory
// that doesn't exist yet on a given checkout (translation lands
// incrementally, see src/copy/legal.ts) simply contributes no jobs.

const localeJobs: { path: string; rules: Rule[] }[] = [];
for (const entry of await Array.fromAsync(
    new Bun.Glob("*").scan({ cwd: "public", onlyFiles: false }),
)) {
    // public/alternatives is itself a "locale-shaped" directory name-wise
    // but isn't one — it's the English comparison pages, already covered
    // by altPageJobs above.
    if (entry === "alternatives" || !statSync(`public/${entry}`).isDirectory())
        continue;
    const dir = `public/${entry}`;
    for (const f of await Array.fromAsync(
        new Bun.Glob("*.html").scan({ cwd: dir }),
    )) {
        const rules = RULES_BY_FILENAME[f];
        if (rules) localeJobs.push({ path: `${dir}/${f}`, rules });
    }
    if (
        statSync(`${dir}/alternatives`, {
            throwIfNoEntry: false,
        })?.isDirectory()
    ) {
        for (const f of await Array.fromAsync(
            new Bun.Glob("*.html").scan({ cwd: `${dir}/alternatives` }),
        )) {
            localeJobs.push({
                path: `${dir}/alternatives/${f}`,
                rules: ALT_RULES,
            });
        }
    }
}
localeJobs.sort((a, b) => a.path.localeCompare(b.path));

const JOBS: { path: string; rules: Rule[] }[] = [
    ...Object.entries(RULES_BY_FILENAME).map(([f, rules]) => ({
        path: `public/${f}`,
        rules,
    })),
    ...altPageJobs,
    ...localeJobs,
    // NB: the generator scripts/gen-alternatives.ts is intentionally NOT
    // rewritten here — these HTML-tuned patterns are unreliable against its TS
    // template literals. If you regenerate the pages, update the generator's
    // SITE constant, GA tag, GitHub/contact links by hand (see its header).
    // llms.txt is markdown served at /llms.txt, so none of the HTML-tuned rules
    // above reach it — it needs its own job or a fork publishes the maintainer's
    // domain and repo to every crawler that reads it. Its GitHub reference is a
    // markdown link in prose, so GITHUB_LINKS_RULE (which deletes a whole <a>
    // line) is wrong here: swap the URL for a placeholder and keep the bullet.
    {
        path: "public/llms.txt",
        rules: [
            {
                name: "llms.txt: GitHub repo URL -> placeholder",
                find: /https:\/\/github\.com\/akutishevsky\/nutrition-mcp/g,
                replace: "https://github.com/your-org/nutrition-mcp",
            },
            DOMAIN_RULE,
        ],
    },
    { path: "public/sitemap.xml", rules: [DOMAIN_RULE] },
    { path: "public/robots.txt", rules: [DOMAIN_RULE] },
    { path: "src/index.ts", rules: [GLAMA_RULE, ...CSP_RULES] },
    // The import widget is a source partial, not a served page, so it is not in
    // the HTML jobs above — but it does embed the maintainer's support address.
    {
        path: "public/widgets/src/templates/import-meals.html",
        rules: [WIDGET_SUPPORT_RULE],
    },
];

let hadWarning = false;

for (const job of JOBS) {
    const file = Bun.file(job.path);
    if (!(await file.exists())) {
        console.log(`  skip  ${job.path} (not found)`);
        continue;
    }
    let text = await file.text();
    const before = text;
    const report: string[] = [];

    for (const rule of rules(job)) {
        // Always replace with a global-flagged clone, matching what count
        // below measures — text.replace(rule.find, ...) with a non-global
        // rule.find silently replaces only the first occurrence, which used
        // to under-strip every rule with >1 match and no explicit /g (this
        // is how terms.html kept 2 of its 3 GitHub links after a "✓ 3×" report).
        const globalFind = new RegExp(rule.find.source, flags(rule.find));
        const count = (text.match(globalFind) || []).length;
        text = text.replace(globalFind, rule.replace ?? "");
        if (count === 0) {
            if (rule.optional) {
                report.push(`    – 0×  ${rule.name}`);
            } else {
                hadWarning = true;
                report.push(`    ⚠ 0×  ${rule.name}`);
            }
        } else {
            report.push(`    ✓ ${count}×  ${rule.name}`);
        }
    }

    const changed = text !== before;
    console.log(`\n${changed ? "edit" : "  ok"}  ${job.path}`);
    report.forEach((line) => console.log(line));
    if (changed && !DRY) await Bun.write(job.path, text);
}

function rules(job: { rules: Rule[] }): Rule[] {
    return job.rules;
}
function flags(re: RegExp): string {
    return re.flags.includes("g") ? re.flags : re.flags + "g";
}

console.log(
    `\n${DRY ? "Dry run — no files written." : "Done."}` +
        (hadWarning
            ? "\n⚠ Some rules matched 0 times — the markup may have changed since this script was written; verify those spots by hand."
            : ""),
);
console.log(
    "Left for you: swap in your own og.png / favicon.ico / apple-touch-icon.png, " +
        "adjust page copy, and replace the " +
        `${PLACEHOLDER_DOMAIN} placeholder with your real domain.`,
);
