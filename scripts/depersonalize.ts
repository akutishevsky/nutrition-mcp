#!/usr/bin/env bun
/**
 * depersonalize.ts — strip the maintainer's personal bits from the public
 * site so the project is clean to self-host.
 *
 *   bun run scripts/depersonalize.ts          # rewrite files in place
 *   bun run scripts/depersonalize.ts --dry    # report only, change nothing
 *
 * What it removes / neutralizes:
 *   - The consent-gated analytics (the `data-analytics` snippet that loads
 *     Google Analytics and Microsoft Clarity after opt-in, the consent
 *     banner and the footer "Cookie settings" button) from every public HTML
 *     page except login.html (which never carries any of it), plus both
 *     services' hosts in the CSP allow-list
 *   - The Glama connector-ownership route (embeds the maintainer's email)
 *   - Patreon "Support" section, hero button and FAQ donation sentence (every
 *     locale); /terms' Patreon mention -> [YOUR DONATION PAGE]
 *   - GitHub repo links (nav, footer, "Star on GitHub" CTA) and the live
 *     star-count fetch; any repo URL left -> github.com/your-org/nutrition-mcp
 *   - Contact section, footer contact link, inline prose mailtos (privacy,
 *     terms, alternatives hub) -> plain text, the address -> your@email.com
 *   - The maintainer's name (the /privacy and /terms operator sentences, all
 *     locales) -> [YOUR NAME]
 *   - The support email embedded in the bulk-import widget
 *   - The security.txt contact (the route 404s until you set your own) and
 *     its advisory/policy repo URLs
 *   - Medium / YouTube footer links on every page
 *   - The nutrition-mcp.com domain -> your-domain.com placeholder
 *     (install/MCP URL, canonical/OG tags, sitemap, robots)
 *   - The "alternative to X" comparison pages under public/alternatives/
 *     (analytics + consent banner, GitHub/contact links, domain)
 *
 * After every rule has run, a hard guard scans every processed file and
 * everything else under public/ for the maintainer's name, email, GitHub
 * handle, Patreon and Medium links and exits non-zero, naming file:line, on
 * any residue — in --dry mode too.
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
 * page <title>/meta description wording, and the privacy policy and terms
 * prose in src/copy/legal*.ts, which still say the site runs Google
 * Analytics and Microsoft Clarity after both are stripped — rewrite them to
 * match whatever your deployment actually loads. Filling in your own name,
 * contact and links where this leaves placeholders is yours to do too.
 *
 * It also rewrites only the generated output, never the sources, so
 * `bun run gen:all` puts everything back. Before regenerating, edit the
 * sources: in scripts/site-partials.ts, either set ANALYTICS_ENABLED to false
 * (drops the snippet, banner and settings button together) or swap in your
 * own GA_MEASUREMENT_ID / CLARITY_PROJECT_ID — don't just blank an id, which
 * leaves the loader and banner in place — plus the GitHub/contact links in
 * its nav()/footer(); SITE in src/routes.ts; then re-run this script.
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

/**
 * Remove the consent-gated analytics. Everything analytics-related on a page
 * is marked `data-analytics` by scripts/site-partials.ts, so these key on
 * that marker rather than on vendor markup: the one inline snippet from
 * analyticsHead() (Google Analytics and Microsoft Clarity both load from
 * inside it, only after the visitor accepts), the consent banner nav()
 * renders above the header, and the footer "Cookie settings" button.
 * Required rather than optional: every page but the login page carries all
 * three (login opts out via footer(..., { consent: false }) and uses the
 * analytics-free BASE_HEAD_ASSETS), so the login jobs take none of these and
 * a 0× anywhere else really does mean the markup drifted.
 */
const ANALYTICS_SNIPPET_RULE: Rule = {
    name: "analytics snippet <script data-analytics>",
    find: /[ \t]*<script data-analytics>[\s\S]*?<\/script>\n/,
};
const CONSENT_BANNER_RULE: Rule = {
    name: 'consent banner <section class="consent">',
    find: /[ \t]*<section class="consent"[\s\S]*?<\/section>\n/,
};
const CONSENT_SETTINGS_RULE: Rule = {
    name: "footer: Cookie settings button",
    find: /[ \t]*<button[^>]*data-consent-open[\s\S]*?<\/button\s*>\n/,
};

/** Every analytics element an ordinary public page carries. */
const ANALYTICS_RULES: Rule[] = [
    ANALYTICS_SNIPPET_RULE,
    CONSENT_BANNER_RULE,
    CONSENT_SETTINGS_RULE,
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

/**
 * Mailto links that sit mid-sentence (the /alternatives hub's "Request a
 * comparison", the /privacy "Contact and your rights" paragraph, the /terms
 * contact line) -> their label as plain text, in every locale. Told apart from
 * the footer "Contact" link, which MAILTO_RULE deletes as a whole line, by
 * (?!\n): a prose link is followed by more sentence text. Where the label is
 * the address itself, EMAIL_TEXT_RULE then swaps it for a placeholder.
 */
const INLINE_MAILTO_RULE: Rule = {
    name: "inline prose mailto -> plain text",
    find: /<a\b[^>]*?href="mailto:anton@nutrition-mcp\.com"[^>]*>\s*([^<]*?)\s*<\/a\s*>(?!\n)/g,
    replace: "$1",
    optional: true,
};

/**
 * Global sweeps, run on every page after its page-specific rules (and before
 * DOMAIN_RULE, so the address is still recognisable). They key on tokens that
 * are identical in all 9 locales — the name is never transliterated, links are
 * links — so no rule needs to know any language's wording. All optional: which
 * page carries which token varies, and the residue guard at the end of this
 * file is what actually proves nothing was left behind.
 */
const PERSONAL_SWEEP_RULES: Rule[] = [
    INLINE_MAILTO_RULE,
    {
        // The operator sentences on /privacy and /terms ("run by Anton
        // Kutishevskyi, an individual developer…") in every locale.
        name: "maintainer name -> [YOUR NAME]",
        find: /Anton Kutishevskyi/g,
        replace: "[YOUR NAME]",
        optional: true,
    },
    {
        // Whatever an unwrapped inline mailto left as text.
        name: "maintainer email text -> your@email.com",
        find: /anton@nutrition-mcp\.com/g,
        replace: "your@email.com",
        optional: true,
    },
    {
        // Footer "How I built this" — rendered by footer() on every page.
        name: "footer: Medium article link",
        find: /[ \t]*<a\b[^>]*?href="https:\/\/medium\.com\/[^"]*"[\s\S]*?<\/a\s*>\n/g,
        optional: true,
    },
    {
        // Footer "Demo" — a short on the maintainer's own channel.
        name: "footer: YouTube demo link",
        find: /[ \t]*<a\b[^>]*?href="https:\/\/(?:www\.)?youtube\.com\/[^"]*"[\s\S]*?<\/a\s*>\n/g,
        optional: true,
    },
    {
        // Any repo URL still standing (a prose mention a page rule unwrapped
        // is plain text already; this catches one nobody wrote a rule for).
        name: "GitHub repo URL -> your-org placeholder",
        find: /https:\/\/github\.com\/akutishevsky\/nutrition-mcp/g,
        replace: "https://github.com/your-org/nutrition-mcp",
        optional: true,
    },
];

/**
 * The FAQ's "Donations on Patreon help cover server costs." sentence, in any
 * locale: a sentence (it must start right after a "." or "。", which keeps it
 * off the page script's "recent-Patreon-posts" comments) that names Patreon.
 * Stays on one line and out of tags and JSON strings, so it only ever removes
 * that one sentence from the answer text and its JSON-LD copy.
 */
const FAQ_PATREON_RULE: Rule = {
    name: "FAQ Patreon donation sentence (any locale)",
    find: /(?<=[.。])[ \t]?[^.。<>"\n]*\bPatreon\b[^.。<>"\n]*[.。]/g,
    replace: "",
};

/**
 * /terms says donations are taken on Patreon. Dropping that sentence would
 * leave the next one ("they are a gift, not a purchase…", its own sentence in
 * Japanese) pointing at nothing, so name a placeholder instead and let the new
 * maintainer decide whether they take donations at all.
 */
const TERMS_PATREON_RULE: Rule = {
    name: "terms: Patreon -> [YOUR DONATION PAGE]",
    find: /\bPatreon\b/g,
    replace: "[YOUR DONATION PAGE]",
};

/**
 * Nav links to the Support/Contact sections we're deleting. nav() is shared
 * chrome, so these render on every page (landing page and alternatives
 * pages alike), not just the landing page. hashPath() prefixes a
 * locale-aware path ("/#support" in English, "/de#support" in German, ...)
 * and the label is translated per locale, so match on the hash target only
 * and capture-drop the label rather than hardcoding either.
 */
const NAV_SUPPORT_RULE: Rule = {
    name: "nav: Support link",
    find: /[ \t]*<a href="[^"]*#support">[^<]*<\/a>\n/g,
};
const NAV_CONTACT_RULE: Rule = {
    name: "nav: Contact link",
    find: /[ \t]*<a href="[^"]*#contact">[^<]*<\/a>\n/g,
};

/** Personal content that only lives in the landing page. */
const LANDING_RULES: Rule[] = [
    // Rewrite prose links first so the generic GitHub sweep can't gut a sentence.
    {
        // The anchor text itself is already translated per locale (e.g. DE
        // "GitHub-Repository"), so this captures it rather than hardcoding
        // the English label — only the href/attributes are locale-constant.
        name: "FAQ 'GitHub repository' prose link -> plain text",
        find: /<a\b[^>]*href="https:\/\/github\.com\/akutishevsky\/nutrition-mcp"[^>]*>([^<]*)<\/a\s*>/,
        replace: "$1",
    },
    FAQ_PATREON_RULE,
    NAV_SUPPORT_RULE,
    NAV_CONTACT_RULE,
    // Hero secondary "Support" button. Label captured rather than hardcoded
    // (translated per locale); href keeps the same "#support" drift as the
    // nav link above.
    {
        name: "hero: Support button",
        find: /[ \t]*<a class="btn btn-secondary" href="#support"[\s\S]*?<\/a\s*>\n/,
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
    // Footer contact link (Privacy stays; Medium/YouTube go in the sweep).
    {
        name: "footer: Contact (mailto) link",
        find: /[ \t]*<a href="mailto:anton@nutrition-mcp\.com">[^<]*<\/a>\n/,
    },
    // Every remaining link to the maintainer's repo (nav, footer, CTA button).
    GITHUB_LINKS_RULE,
    // The live star-count fetch (its target span was in the CTA button above).
    {
        name: "live GitHub star-count script",
        find: /[ \t]*\/\/ -+ live GitHub star count -+\n[\s\S]*?\.catch\(function \(\) \{\}\);\n[ \t]*\}\n/,
    },
    // The recent-Patreon-posts fetch. Its target block (#patreon-updates) lives
    // inside the "section: Support (Patreon)" HTML this file already strips
    // wholesale above, so only the script needs its own rule here.
    {
        name: "recent Patreon posts script",
        find: /[ \t]*\/\/ -+ recent Patreon posts -+\n[\s\S]*?\.catch\(function \(\) \{\}\);\n[ \t]*\}\n/,
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

/** Tighten the Content-Security-Policy: drop the GA, Clarity and GitHub API hosts. */
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
    {
        name: "CSP: Clarity hosts (script-src + connect-src + img-src)",
        find: / https:\/\/\*\.clarity\.ms(?: https:\/\/c\.bing\.com)?/g,
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
// bits as the landing page (analytics + consent banner, GitHub links, contact mailto, the domain) but
// none of the Patreon/Medium/Contact-section markup, so they get a focused set.
// They do still render the shared nav() chrome, though, which links to the
// landing page's #support/#contact anchors — those need stripping here too.
// Mailto rules run before DOMAIN_RULE so the email is removed before the domain
// sweep could rewrite it to a placeholder address.
const ALT_RULES: Rule[] = [
    ...ANALYTICS_RULES,
    GITHUB_LINKS_RULE,
    NAV_SUPPORT_RULE,
    NAV_CONTACT_RULE,
    {
        // The hub's closing "Request a comparison." is nothing but a mailto
        // link and its full stop, so unwrapping it (what INLINE_MAILTO_RULE
        // does to prose mailtos) would leave a call to action with nowhere
        // to go. Drop the link and its "." together, in every locale; the
        // sentence before it already ends the note. Only the hub has it.
        name: "alternatives hub: 'Request a comparison' mailto sentence",
        find: /\s*<a\b[^>]*?href="mailto:anton@nutrition-mcp\.com"[^>]*>[^<]*<\/a\s*>\.(?=\s*<\/p>)/g,
        optional: true,
    },
    // Footer "Contact" links.
    MAILTO_RULE,
    DOMAIN_RULE,
];

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

/**
 * The RFC 9116 security.txt contact (src/security-txt.ts). Blank the constant
 * rather than deleting it: an empty contact makes the route answer 404, since a
 * security.txt with no Contact line is invalid. Nothing is served while the
 * contact is empty, but the advisory and policy URLs beside it still name the
 * maintainer's repo, so SECURITY_TXT_REPO_RULE points them at a placeholder.
 */
const SECURITY_TXT_RULE: Rule = {
    name: "security.txt: contact email -> empty",
    find: /(\/\* security-contact:start \*\/\s*\n\s*export const SECURITY_CONTACT = )"[^"]*"/,
    replace: '$1""',
};
const SECURITY_TXT_REPO_RULE: Rule = {
    name: "security.txt: advisory/policy repo URLs -> your-org placeholder",
    find: /https:\/\/github\.com\/akutishevsky\/nutrition-mcp/g,
    replace: "https://github.com/your-org/nutrition-mcp",
};

const altPageJobs = (
    await Array.fromAsync(
        new Bun.Glob("*.html").scan({ cwd: "public/alternatives" }),
    )
)
    .sort()
    .map((f) => ({ path: `public/alternatives/${f}`, rules: ALT_RULES }));

// Translated site: public/{locale}/privacy.html, public/{locale}/terms.html,
// and (once those pages are migrated too) .../tools.html, .../index.html,
// .../alternatives/*.html. Discovered at run time the same way altPageJobs
// is, rather than hand-listing every locale: a locale directory that
// doesn't exist yet on a given checkout (translation lands incrementally,
// see src/copy/legal.ts) simply contributes no jobs. Rules per filename
// mirror the English job for that same page below — keep the two in sync
// by hand when you change one, the same as the rest of this file already
// asks for GITHUB_LINKS_RULE / DOMAIN_RULE etc.
const RULES_BY_FILENAME: Record<string, Rule[]> = {
    "login.html": [
        // No analytics rules: login carries no snippet, banner or button.
        NAV_SUPPORT_RULE,
        NAV_CONTACT_RULE,
        GITHUB_LINKS_RULE,
        MAILTO_RULE,
        DOMAIN_RULE,
    ],
    "privacy.html": [
        ...ANALYTICS_RULES,
        NAV_SUPPORT_RULE,
        NAV_CONTACT_RULE,
        GITHUB_LINKS_RULE,
        MAILTO_RULE,
        DOMAIN_RULE,
    ],
    "terms.html": [
        ...ANALYTICS_RULES,
        NAV_SUPPORT_RULE,
        NAV_CONTACT_RULE,
        // Prose-embedded, so unwrap to text first — same reasoning as
        // LANDING_RULES: run before the generic sweeps below so they can't
        // gut a sentence. The footer and mobile-menu also render a
        // same-labeled "GitHub" link, but always immediately followed by a
        // newline (each sits alone on its own line) where the prose mention
        // is followed by more sentence text — (?!\n) tells them apart so
        // this rule only fires on the prose one, and GITHUB_LINKS_RULE below
        // cleanly deletes the other two as whole lines instead of leaving
        // dangling plain-text "GitHub". The prose contact mailto is
        // unwrapped the same way by INLINE_MAILTO_RULE in the global sweep.
        {
            name: "terms: 'GitHub' prose link -> plain text",
            find: /<a\b[^>]*href="https:\/\/github\.com\/akutishevsky\/nutrition-mcp"[^>]*>GitHub<\/a\s*>(?!\n)/,
            replace: "GitHub",
        },
        TERMS_PATREON_RULE,
        // Sweeps the header icon-button GitHub link and the footer/mobile-menu
        // GitHub + Contact links the prose-scoped rules above deliberately
        // don't touch.
        GITHUB_LINKS_RULE,
        MAILTO_RULE,
        DOMAIN_RULE,
    ],
    "tools.html": [
        ...ANALYTICS_RULES,
        GITHUB_LINKS_RULE,
        NAV_SUPPORT_RULE,
        NAV_CONTACT_RULE,
        MAILTO_RULE,
        DOMAIN_RULE,
    ],
    "index.html": [...ANALYTICS_RULES, ...LANDING_RULES, DOMAIN_RULE],
};

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
    // The English pages take the same rules as their locale mirrors.
    ...[
        "index.html",
        "login.html",
        "privacy.html",
        "terms.html",
        "tools.html",
    ].map((f) => ({ path: `public/${f}`, rules: RULES_BY_FILENAME[f]! })),
    ...altPageJobs,
    ...localeJobs,
    // NB: no generator source is rewritten here — these HTML-tuned patterns
    // are unreliable against TS template literals. If you regenerate the
    // pages, update the sources by hand first (see this file's header).
    // llms.txt is markdown served at /llms.txt, so none of the HTML-tuned rules
    // above reach it — it needs its own job or a fork publishes the maintainer's
    // domain and repo to every crawler that reads it. Its GitHub reference is a
    // markdown link in prose, so GITHUB_LINKS_RULE (which deletes a whole <a>
    // line) is wrong here: swap the URL for a placeholder and keep the bullet.
    // (The global sweep's repo-URL rule swaps the URL for a placeholder.)
    { path: "public/llms.txt", rules: [DOMAIN_RULE] },
    { path: "public/sitemap.xml", rules: [DOMAIN_RULE] },
    { path: "public/robots.txt", rules: [DOMAIN_RULE] },
    { path: "src/index.ts", rules: [GLAMA_RULE, ...CSP_RULES] },
    {
        path: "src/security-txt.ts",
        rules: [SECURITY_TXT_RULE, SECURITY_TXT_REPO_RULE],
    },
    // The import widget is a source partial, not a served page, so it is not in
    // the HTML jobs above — but it does embed the maintainer's support address.
    {
        path: "public/widgets/src/templates/import-meals.html",
        rules: [WIDGET_SUPPORT_RULE],
    },
];

let hadWarning = false;
/** Every processed file's content after all rules, for the residue guard. */
const processed: { path: string; text: string }[] = [];

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
    processed.push({ path: job.path, text });
}

/**
 * A job's rules plus, for every page a visitor or crawler reads (HTML and the
 * .txt files), the global PERSONAL_SWEEP_RULES — inserted ahead of
 * DOMAIN_RULE, so the email sweep still sees nutrition-mcp.com.
 */
function rules(job: { path: string; rules: Rule[] }): Rule[] {
    if (!/\.(html|txt)$/.test(job.path)) return job.rules;
    const at = job.rules.indexOf(DOMAIN_RULE);
    if (at === -1) return [...job.rules, ...PERSONAL_SWEEP_RULES];
    return [
        ...job.rules.slice(0, at),
        ...PERSONAL_SWEEP_RULES,
        ...job.rules.slice(at),
    ];
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
    "Left for you: put in your own name, contact address and links — the privacy " +
        "policy and terms now say [YOUR NAME] and your@email.com (and terms says " +
        "[YOUR DONATION PAGE] where donations are mentioned), and the footer has " +
        "no Contact, GitHub, Medium or Demo link until you add yours. Make those " +
        "edits in the sources (src/copy/legal*.ts for all 9 locales, nav()/footer() " +
        "in scripts/site-partials.ts), since `bun run gen:all` regenerates the pages " +
        "from them and brings the maintainer's details back. Also swap in your own " +
        "og.png / favicon.ico / apple-touch-icon.png, adjust page copy (the privacy " +
        "policy and terms still name Google Analytics and Microsoft Clarity), and " +
        `replace the ${PLACEHOLDER_DOMAIN} placeholder with your real domain and ` +
        "github.com/your-org/nutrition-mcp with your repo. Set SECURITY_CONTACT in " +
        "src/security-txt.ts and rewrite SECURITY.md for your own deployment.",
);

/**
 * Hard guard: none of the maintainer's personal details may survive on any
 * processed file. Scans the transformed content (so --dry checks exactly what
 * a real run would write) and fails the run, naming file:line:token, on any
 * residue — a redesign or new copy that slips past every rule above is caught
 * here rather than shipped. The name is never transliterated in the current
 * copy; the Cyrillic/Japanese spellings are here in case a translation starts.
 */
const PERSONAL_TOKENS: RegExp[] = [
    /anton@/i,
    /kutishevsk/i, // also catches the akutishevsky handle
    /patreon\.com/i,
    /medium\.com\/@/i,
    /Y1EHbfimQ70/, // the maintainer's YouTube demo short
    /\banton\b/i,
    /Антон|Кутишевськ|Кутішевськ|アントン/,
];
// Everything under public/ is served (pages, site.js, styles.css, llms.txt…)
// or, for public/widgets/src, inlined into a served widget — so the guard reads
// all of it, not only the files a job above rewrote. A processed file is
// checked in its transformed form (what a real run writes); every other file
// as it stands on disk.
const scanned = new Map(processed.map((p) => [p.path, p.text]));
for (const f of await Array.fromAsync(
    new Bun.Glob("public/**/*.{html,txt,xml,js,css,json,svg,md}").scan("."),
)) {
    if (!scanned.has(f)) scanned.set(f, await Bun.file(f).text());
}
const residue: string[] = [];
for (const [path, text] of scanned) {
    text.split("\n").forEach((line, i) => {
        for (const token of PERSONAL_TOKENS) {
            const m = line.match(token);
            if (m) residue.push(`${path}:${i + 1}: ${m[0]}`);
        }
    });
}
if (residue.length > 0) {
    console.error(
        `\n✗ Personal info left after depersonalizing (${residue.length}):\n` +
            residue.map((r) => `    ${r}`).join("\n") +
            "\n  Add a rule for each, then re-run.",
    );
    process.exit(1);
}
console.log(
    "\n✓ No personal info left in any processed file or under public/.",
);
