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
 *   - Patreon "Support" section and hero button
 *   - GitHub repo links (nav, footer, "Star on GitHub" CTA) and the live
 *     star-count fetch
 *   - Contact section, footer contact link
 *   - Medium / YouTube footer links
 *   - The nutrition-mcp.com domain -> your-domain.com placeholder
 *     (install/MCP URL, canonical/OG tags, sitemap, robots)
 *   - The "alternative to X" comparison pages under public/alternatives/
 *     (GA, GitHub/contact links, domain)
 *
 * It is tuned to the current markup. If a pattern stops matching after a
 * redesign, the run reports "0 matches" for that rule so you can spot it.
 * Re-running is safe (idempotent): already-clean rules simply report 0.
 *
 * NOT auto-handled (edit by hand if you want): marketing copy/tone, the
 * brand images (public/og.png, favicon.ico, apple-touch-icon.png), the
 * page <title>/meta description wording, and the alternatives-page generator
 * scripts/gen-alternatives.ts (update its SITE constant, GA tag, and
 * GitHub/contact links before regenerating).
 */

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
        name: "GA loader <script>",
        find: /[ \t]*<script\b[\s\S]*?googletagmanager[\s\S]*?<\/script>\n/,
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
 * Standalone maintainer mailto links (e.g. the footer "Contact" link). The
 * label is matched with [^<]* (not [\s\S]*) so a link whose </a> isn't followed
 * by a newline can't run on and swallow everything up to the next anchor.
 */
const MAILTO_RULE: Rule = {
    name: "maintainer mailto links",
    find: /[ \t]*<a\b[^>]*?href="mailto:anton@nutrition-mcp\.com"[^>]*>[^<]*<\/a\s*>\n/g,
};

/** The one inline mailto in prose (hub "Request a comparison") -> plain text. */
const HUB_MAILTO_RULE: Rule = {
    name: "hub: inline 'Request a comparison' mailto -> text",
    find: /<a\b[^>]*?href="mailto:anton@nutrition-mcp\.com"[^>]*>\s*Request a comparison<\/a\s*>/,
    replace: "Request a comparison",
    optional: true, // hub-only; absent from the per-app pages
};

/** Personal content that only lives in the landing page. */
const LANDING_RULES: Rule[] = [
    // Rewrite prose links first so the generic GitHub sweep can't gut a sentence.
    {
        name: "FAQ 'GitHub repository' prose link -> plain text",
        find: /<a\b[^>]*href="https:\/\/github\.com\/akutishevsky\/nutrition-mcp"[^>]*>GitHub repository<\/a\s*>/,
        replace: "repository",
    },
    {
        name: "FAQ Patreon donation sentence",
        find: /\s*Donations on Patreon\s+help cover server costs\./g,
        replace: "",
    },
    // Nav links to sections we're deleting + the repo link.
    {
        name: "nav: Support link",
        find: /[ \t]*<a href="#support">Support<\/a>\n/,
    },
    {
        name: "nav: Contact link",
        find: /[ \t]*<a href="#contact">Contact<\/a>\n/,
    },
    // Hero secondary "Support" button.
    {
        name: "hero: Support button",
        find: /[ \t]*<a class="btn btn-secondary" href="#support"[\s\S]*?>Support<\/a\s*>\n/,
    },
    // Whole Support (Patreon) and Contact sections.
    {
        name: "section: Support (Patreon)",
        find: /[ \t]*<!-- Support -->[\s\S]*?<\/section>\n/,
    },
    {
        name: "section: Contact",
        find: /[ \t]*<!-- Contact -->[\s\S]*?<\/section>\n/,
    },
    // Footer social/contact links (Privacy stays).
    {
        name: "footer: Medium link",
        find: /[ \t]*<a\b[^>]*?href="https:\/\/medium\.com[\s\S]*?<\/a\s*>\n/,
    },
    {
        name: "footer: YouTube link",
        find: /[ \t]*<a\b[^>]*?href="https:\/\/youtube\.com[\s\S]*?<\/a\s*>\n/,
    },
    {
        name: "footer: Contact (mailto) link",
        find: /[ \t]*<a href="mailto:anton@nutrition-mcp\.com">Contact<\/a>\n/,
    },
    // Every remaining link to the maintainer's repo (nav, footer, CTA button).
    GITHUB_LINKS_RULE,
    // The live star-count fetch (its target span was in the CTA button above).
    {
        name: "live GitHub star-count script",
        find: /[ \t]*\/\/ -+ live GitHub star count -+\n[\s\S]*?\.catch\(function \(\) \{\}\);\n[ \t]*\}\n/,
    },
];

/** Tighten the Content-Security-Policy: drop GA + GitHub API hosts. */
const CSP_RULES: Rule[] = [
    {
        name: "CSP: connect-src GA + github hosts",
        find: / https:\/\/www\.google-analytics\.com https:\/\/\*\.google-analytics\.com https:\/\/\*\.analytics\.google\.com https:\/\/\*\.googletagmanager\.com https:\/\/api\.github\.com/,
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

// The generated "alternative to X" comparison pages carry the same personal
// bits as the landing page (GA, GitHub links, contact mailto, the domain) but
// none of the Patreon/Medium/Contact-section markup, so they get a focused set.
// Mailto rules run before DOMAIN_RULE so the email is removed before the domain
// sweep could rewrite it to a placeholder address.
const ALT_RULES: Rule[] = [
    ...ANALYTICS_RULES,
    GITHUB_LINKS_RULE,
    // Unwrap the inline prose mailto first, so the standalone-link rule below
    // only sees the footer "Contact" links (and can't over-match across tags).
    HUB_MAILTO_RULE,
    MAILTO_RULE,
    DOMAIN_RULE,
];

// Every comparison page under public/alternatives/, discovered at run time so a
// newly generated app page is depersonalized without editing this list.
const altPageJobs = (
    await Array.fromAsync(
        new Bun.Glob("*.html").scan({ cwd: "public/alternatives" }),
    )
)
    .sort()
    .map((f) => ({ path: `public/alternatives/${f}`, rules: ALT_RULES }));

const JOBS: { path: string; rules: Rule[] }[] = [
    {
        path: "public/index.html",
        rules: [...ANALYTICS_RULES, ...LANDING_RULES, DOMAIN_RULE],
    },
    { path: "public/login.html", rules: [...ANALYTICS_RULES, DOMAIN_RULE] },
    { path: "public/privacy.html", rules: [...ANALYTICS_RULES, DOMAIN_RULE] },
    // Tools reference page: GA + the nav/footer GitHub link, the footer contact
    // mailto, and the canonical/OG domain.
    {
        path: "public/tools.html",
        rules: [
            ...ANALYTICS_RULES,
            GITHUB_LINKS_RULE,
            MAILTO_RULE,
            DOMAIN_RULE,
        ],
    },
    ...altPageJobs,
    // NB: the generator scripts/gen-alternatives.ts is intentionally NOT
    // rewritten here — these HTML-tuned patterns are unreliable against its TS
    // template literals. If you regenerate the pages, update the generator's
    // SITE constant, GA tag, GitHub/contact links by hand (see its header).
    { path: "public/sitemap.xml", rules: [DOMAIN_RULE] },
    { path: "public/robots.txt", rules: [DOMAIN_RULE] },
    { path: "src/index.ts", rules: CSP_RULES },
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
        const count = (
            text.match(new RegExp(rule.find.source, flags(rule.find))) || []
        ).length;
        text = text.replace(rule.find, rule.replace ?? "");
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
