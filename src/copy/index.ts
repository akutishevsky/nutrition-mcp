// Typed content for the landing page (public/index.html), rendered by
// scripts/gen-index.ts. Extracted from the previously hand-authored
// public/index.html so English and every future translation go through the
// same generator instead of a hand-authored English file sitting next to
// generated ones (see CLAUDE.md's "Public site" section, and
// src/copy/legal.ts for the pattern this follows).
//
// `Html`-suffixed fields carry trusted inline markup (<strong>, <a href>,
// <em>, <q>, the decorative chat-widget preview markup) — same trust level
// as the rest of the scripts/gen-*.ts family: developer-authored constants,
// not visitor input, so nothing here is HTML-escaped on the way out. Plain
// fields (no `Html` suffix) are plain text and get run through esc() by the
// generator.
//
// Design choice worth flagging: the hero's decorative chat demo and the
// "Try saying" carousel's seven example exchanges are each stored as ONE
// trusted HTML block per message (see `heroChatHtml` and `TrySlide.aiHtml`)
// rather than exploded into one field per widget label ("Protein", "Calories
// today", ...). Those labels are illustrative UI chrome mimicking the real
// in-chat widgets (see public/widgets/STYLE_GUIDE.md), not sentence-level
// prose that reorders per language, and they repeat near-identically across
// eight widget instances — typing each one separately would multiply the
// same handful of words dozens of times for no translation benefit. The
// genuinely sentence-level prose (what the user typed, the assistant's
// concluding sentence) lives inside these same HTML blocks, extracted
// verbatim, exactly the way src/copy/legal.ts inlines prose inside trusted
// HTML `<li>`/`<p>` strings. A future translation edits the HTML directly,
// same as it would for any legal.ts block.
//
// INDEX is `Partial<Record<SiteLocale, IndexDoc>>`, not the full `Record`,
// while translation is still in progress — see legal.ts's PRIVACY/TERMS for
// why. This pass is English-only: no other locale entry exists yet.

import type { SiteLocale } from "../routes.js";
import { INDEX_DE } from "./index.de.js";
import { INDEX_ES } from "./index.es.js";
import { INDEX_FR } from "./index.fr.js";
import { INDEX_NL } from "./index.nl.js";
import { INDEX_PL } from "./index.pl.js";
import { INDEX_IT } from "./index.it.js";
import { INDEX_UK } from "./index.uk.js";
import { INDEX_JA } from "./index.ja.js";

/** One FAQ entry. `visibleHtml` is what a human reads in the <details>.
 * `jsonLdText` is optional: when omitted, the generator derives the
 * JSON-LD `Answer.text` by stripping tags out of `visibleHtml`, which is
 * exactly right for every FAQ answer that contains no markup of its own
 * (or whose only markup is an inline link whose surrounding words already
 * read as one sentence, e.g. "Can I self-host it?"). Two entries carry an
 * explicit override because the current page's JSON-LD and visible copy
 * already diverge in wording (pre-existing, not introduced by this
 * extraction) — see the "Does it work with ChatGPT?" entry below. */
export interface FaqEntry {
    question: string;
    visibleHtml: string;
    jsonLdText?: string;
}

export interface TrySlide {
    /** One example exchange's full `.mini-chat` content — trusted HTML,
     * verbatim: the user's message, the typing indicator, any decorative
     * widget preview, and the assistant's concluding sentence. Kept as one
     * block rather than split into user/assistant fields because two of
     * the seven slides lead with a decorative photo/barcode SVG before the
     * user message, so there is no single fixed shape the generator could
     * safely reassemble from separate fields without duplicating markup. */
    html: string;
}

export interface FeatureCard {
    /** Font Awesome icon class, e.g. "fa-solid fa-utensils" — not prose,
     * kept here only so each card's icon travels with its text. */
    icon: string;
    title: string;
    body: string;
}

export interface IndexDoc {
    title: string;
    metaDescription: string;
    ogDescription: string;
    keywords: string;

    chatChrome: {
        brand: string;
        status: string;
        inputPlaceholder: string;
    };

    hero: {
        eyebrow: string;
        titleBeforeEm: string;
        titleEm: string;
        titleAfterEm: string;
        lead: string;
        ctaPrimary: string;
        ctaSecondary: string;
        /** Floating macro chips beside the demo card — trusted HTML. */
        chipsHtml: string;
        /** The decorative chat demo's message thread — trusted HTML. */
        chatHtml: string;
    };

    how: {
        eyebrow: string;
        title: string;
        steps: { title: string; body: string }[];
    };

    install: {
        eyebrow: string;
        title: string;
        sub: string;
        claude: { steps: string[]; note: string };
        chatgpt: { steps: string[] };
        other: { note: string };
        /** The third install-tab's visible label ("Other agents") — was
         * hardcoded English in scripts/gen-index.ts alongside the "Claude"/
         * "ChatGPT" brand-name tabs (correctly untranslated) until a
         * translation review caught it: unlike those two, this is ordinary
         * descriptive text, not a proper noun. */
        otherTabLabel: string;
    };

    onboarding: {
        eyebrow: string;
        title: string;
        sub: string;
        steps: string[];
        note: string;
        toolsCta: { heading: string; body: string; arrow: string };
    };

    try: {
        eyebrow: string;
        title: string;
        sub: string;
        slides: TrySlide[];
        prevLabel: string;
        nextLabel: string;
        exampleLabel: string;
    };

    stats: {
        eyebrow: string;
        title: string;
        factsTitle: string;
        servingPrefix: string;
        servingBold: string;
        liveLabel: string;
        calLabel: string;
        calSmall: string;
        calCaption: string;
        rowFoodLogs: string;
        rowProtein: string;
        rowCarbs: string;
        rowFat: string;
        /**
         * The kg / lb toggle on the Nutrition Facts title line. The visible
         * text is the symbol ("kg" / "lb") — hardcoded in the generator, the
         * same in every locale, left alone the way "kcal" is. These are the
         * accessible names, and each one has to CONTAIN its own button's
         * symbol: WCAG 2.5.3 Label in Name, so that a voice-control user
         * saying "click lb" reaches a control that is actually named "lb". A
         * bare "Pounds" is a control they cannot speak to. Hence
         * "Word (symbol)" in every locale — the word leads, so a screen
         * reader still announces the unit rather than spelling two letters,
         * and the symbol rides along for the match. That token is the Latin
         * symbol even where the locale abbreviates differently (uk is
         * "Кілограми (kg)", not "кг"): it has to be the glyph that is on
         * screen. de/nl/fr reached the same shape earlier for an unrelated
         * reason — see the note in src/copy/index.de.ts. unitGroupLabel
         * names the pair.
         */
        unitGroupLabel: string;
        unitKgLabel: string;
        unitLbLabel: string;
        foot: string;
        mapPrefix: string;
        mapSuffix: string;
        mapAriaLabel: string;
    };

    features: {
        eyebrow: string;
        title: string;
        cards: FeatureCard[];
    };

    why: {
        eyebrow: string;
        title: string;
        sub: string;
        oldHeading: string;
        oldItems: string[];
        newHeading: string;
        newItems: string[];
        /** Trusted HTML — contains a link to /alternatives marked with
         * data-link="alternatives" for the generator to localize. */
        noteHtml: string;
    };

    trust: { label: string; small: string }[];

    support: {
        eyebrow: string;
        title: string;
        sub: string;
        updatesTitle: string;
        /** Reassurance that reading these posts costs nothing — sits directly
         *  under updatesTitle, right where the paid-tier card above it could
         *  make a reader assume otherwise. */
        updatesNote: string;
        /** aria-labels for the recent-posts carousel, which pages through
         *  groups of 3 cards (up to 12 posts -> up to 4 pages) — mirrors
         *  try.prevLabel / try.nextLabel / try.exampleLabel's shape, but that
         *  pair reads "Previous/Next example" which only fits the chat demo,
         *  so this carousel gets its own. updatesDotLabel is a bare noun
         *  ("Update"), suffixed client-side with " 1", " 2", ... per dot
         *  (one dot per PAGE, not per post), the same way try.exampleLabel is
         *  used server-side in renderDoc. */
        updatesPrevLabel: string;
        updatesNextLabel: string;
        updatesDotLabel: string;
        free: { tier: string; price: string; desc: string; cta: string };
        paid: { tier: string; price: string; desc: string; cta: string };
    };

    cta: {
        title: string;
        sub: string;
        primary: string;
        secondary: string;
    };

    contact: {
        eyebrow: string;
        title: string;
        sub: string;
        cta: string;
    };

    faqSection: {
        eyebrow: string;
        title: string;
    };
    faq: FaqEntry[];
}

const HERO_CHIPS_HTML_PLACEHOLDER = `
                            <span class="chip chip-1"
                                ><i style="--c: var(--cal)"></i
                                ><b>+340</b> kcal</span
                            >
                            <span class="chip chip-2"
                                ><i style="--c: #8b5cf6"></i
                                ><b>20 g</b> protein</span
                            >
                            <span class="chip chip-3"
                                ><i style="--c: #10b981"></i
                                ><b>30 g</b> carbs</span
                            >
                            <span class="chip chip-4"
                                ><i style="--c: #0ea5e9"></i
                                ><b>500 ml</b> water</span
                            >`;
const HERO_CHAT_HTML_PLACEHOLDER = `
                                <div class="cw-header">
                                    <span class="cw-avatar"
                                        ><i class="fa-solid fa-apple-whole"></i
                                    ></span>
                                    <span class="cw-title">Nutrition MCP</span>
                                    <span class="cw-status">online</span>
                                </div>
                                <div class="cw-body">
                                    <div class="chat-thread">
                                        <div class="msg msg-user">
                                            Two eggs, whole-wheat toast, and a
                                            coffee for breakfast
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head">
                                                    <div class="wdg-title">
                                                        Meal logged
                                                    </div>
                                                    <div class="wdg-sub">
                                                        Two eggs, toast &amp;
                                                        coffee · breakfast
                                                    </div>
                                                    <div
                                                        class="wdg-meta wdg-kcal"
                                                    >
                                                        +340 kcal
                                                    </div>
                                                </div>
                                                <div class="wdg-strip">
                                                    <div class="wdg-srow">
                                                        <div class="wdg-cal">
                                                            <div
                                                                class="wdg-gauge"
                                                            >
                                                                <div
                                                                    class="wdg-ring"
                                                                    style="
                                                                        --c: var(
                                                                            --cal
                                                                        );
                                                                        --p: 16;
                                                                    "
                                                                ></div>
                                                                <div
                                                                    class="wdg-rc"
                                                                >
                                                                    <span
                                                                        class="wdg-rp"
                                                                        style="
                                                                            color: var(
                                                                                --cal
                                                                            );
                                                                        "
                                                                        >16%</span
                                                                    >
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-caltxt"
                                                            >
                                                                <div
                                                                    class="wdg-callab"
                                                                >
                                                                    Calories
                                                                    today
                                                                </div>
                                                                <div
                                                                    class="wdg-calline"
                                                                >
                                                                    <div
                                                                        class="wdg-calval"
                                                                    >
                                                                        340<span
                                                                            class="wdg-calgoal"
                                                                            >/
                                                                            2,100</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calleft"
                                                                    >
                                                                        1,760
                                                                        kcal
                                                                        left
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="wdg-grids">
                                                            <div
                                                                class="wdg-mgrid"
                                                            >
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Protein</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >20<span
                                                                                class="wdg-msub"
                                                                                >/150</span
                                                                            ></span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 13.3%;
                                                                                background: var(
                                                                                    --pro
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Carbs</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >30<span
                                                                                class="wdg-msub"
                                                                                >/220</span
                                                                            ></span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 13.6%;
                                                                                background: var(
                                                                                    --car
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Fat</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >15<span
                                                                                class="wdg-msub"
                                                                                >/70</span
                                                                            ></span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 21.4%;
                                                                                background: var(
                                                                                    --fat
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mgrid wdg-lim wdg-sec"
                                                            >
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Sugar</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >2.5</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 5.6%;
                                                                                background: var(
                                                                                    --sug
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mcap"
                                                                    >
                                                                        limit 45
                                                                        g
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Caffeine</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >95</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 23.8%;
                                                                                background: var(
                                                                                    --caf
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mcap"
                                                                    >
                                                                        limit
                                                                        400 mg
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mtile"
                                                                >
                                                                    <div
                                                                        class="wdg-mtop"
                                                                    >
                                                                        <span
                                                                            class="wdg-mkey"
                                                                            >Fiber</span
                                                                        >
                                                                        <span
                                                                            class="wdg-mnum"
                                                                            >3.4</span
                                                                        >
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mbar"
                                                                    >
                                                                        <div
                                                                            class="wdg-mfill"
                                                                            style="
                                                                                width: 11.3%;
                                                                                background: var(
                                                                                    --fib
                                                                                );
                                                                            "
                                                                        ></div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mcap"
                                                                    >
                                                                        of 30 g
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-mhint"
                                                                aria-hidden="true"
                                                            >
                                                                Tap a metric for
                                                                the meals behind
                                                                it
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            Done — added that to breakfast: two
                                            eggs, toast, and a coffee. That's
                                            about 340 kcal (20g protein, 30g
                                            carbs, 15g fat, 3.4g fiber), plus
                                            95mg of caffeine from the coffee.
                                        </div>

                                        <div class="msg msg-user">
                                            How's my weight trending?
                                        </div>

                                        <div class="msg msg-ai">
                                            <div class="wdg">
                                                <div class="wdg-head wdg-mid">
                                                    <div class="wdg-title">
                                                        Weight
                                                    </div>
                                                    <div
                                                        class="wdg-seg"
                                                        aria-hidden="true"
                                                    >
                                                        <span
                                                            class="wdg-seg-btn wdg-on"
                                                            >7</span
                                                        >
                                                        <span
                                                            class="wdg-seg-btn"
                                                            >14</span
                                                        >
                                                        <span
                                                            class="wdg-seg-btn"
                                                            >30</span
                                                        >
                                                    </div>
                                                </div>
                                                <div class="wdg-wmain">
                                                    <div class="wdg-wnow">
                                                        <div class="wdg-wtag">
                                                            Latest
                                                        </div>
                                                        <div class="wdg-wval">
                                                            74.5<span
                                                                class="wdg-wunit"
                                                                >kg</span
                                                            >
                                                        </div>
                                                        <div
                                                            class="wdg-wdelta"
                                                            style="
                                                                color: var(
                                                                    --accent
                                                                );
                                                            "
                                                        >
                                                            −0.6 kg since 5 Jul
                                                        </div>
                                                    </div>
                                                    <svg
                                                        class="wdg-wchart"
                                                        viewBox="0 0 300 62"
                                                        role="img"
                                                        aria-label="Weight from 5 Jul to 11 Jul, latest 74.5 kg"
                                                    >
                                                        <line
                                                            class="wdg-goalline"
                                                            x1="5"
                                                            y1="50.4"
                                                            x2="295"
                                                            y2="50.4"
                                                        />
                                                        <path
                                                            d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1 L295.0 57 L5.0 57 Z"
                                                            fill="var(--accent)"
                                                            opacity="0.16"
                                                        />
                                                        <path
                                                            d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1"
                                                            fill="none"
                                                            stroke="var(--accent)"
                                                            stroke-width="2"
                                                            stroke-linejoin="round"
                                                            stroke-linecap="round"
                                                        />
                                                        <circle
                                                            cx="5.0"
                                                            cy="13.6"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="53.3"
                                                            cy="15.4"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="101.7"
                                                            cy="18.9"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="150.0"
                                                            cy="17.1"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="198.3"
                                                            cy="22.4"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="246.7"
                                                            cy="20.6"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                        <circle
                                                            cx="295.0"
                                                            cy="24.1"
                                                            r="2.6"
                                                            fill="var(--accent)"
                                                        />
                                                    </svg>
                                                </div>
                                                <div class="wdg-sec wdg-wfoot">
                                                    <span
                                                        >7 weigh-ins · 5 Jul →
                                                        11 Jul</span
                                                    >
                                                    <span
                                                        ><b>Target 73.0 kg</b> ·
                                                        1.5 kg to lose</span
                                                    >
                                                </div>
                                            </div>
                                            You're down 0.6 kg this week and 1.5
                                            kg from your 73 kg goal — your 7-day
                                            average is trending down nicely.
                                        </div>
                                    </div>
                                </div>
                                <div class="cw-input">
                                    <span class="cw-field"
                                        >Message Nutrition…</span
                                    >
                                    <span class="cw-send"
                                        ><i class="fa-solid fa-arrow-up"></i
                                    ></span>
                                </div>`;
const SLIDE_1_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Log a chicken burrito bowl for
                                                lunch
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            Meal logged
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Chicken burrito bowl
                                                            · lunch
                                                        </div>
                                                        <div
                                                            class="wdg-meta wdg-kcal"
                                                        >
                                                            +650 kcal
                                                        </div>
                                                    </div>
                                                    <div class="wdg-strip">
                                                        <div class="wdg-srow">
                                                            <div
                                                                class="wdg-cal"
                                                            >
                                                                <div
                                                                    class="wdg-gauge"
                                                                >
                                                                    <div
                                                                        class="wdg-ring"
                                                                        style="
                                                                            --c: var(
                                                                                --cal
                                                                            );
                                                                            --p: 47;
                                                                        "
                                                                    ></div>
                                                                    <div
                                                                        class="wdg-rc"
                                                                    >
                                                                        <span
                                                                            class="wdg-rp"
                                                                            style="
                                                                                color: var(
                                                                                    --cal
                                                                                );
                                                                            "
                                                                            >47%</span
                                                                        >
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-caltxt"
                                                                >
                                                                    <div
                                                                        class="wdg-callab"
                                                                    >
                                                                        Calories
                                                                        today
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            990<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2,100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            1,110
                                                                            kcal
                                                                            left
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-grids"
                                                            >
                                                                <div
                                                                    class="wdg-mgrid"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Protein</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >62<span
                                                                                    class="wdg-msub"
                                                                                    >/150</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 41.3%;
                                                                                    background: var(
                                                                                        --pro
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Carbs</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >98<span
                                                                                    class="wdg-msub"
                                                                                    >/220</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 44.5%;
                                                                                    background: var(
                                                                                        --car
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Fat</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >37<span
                                                                                    class="wdg-msub"
                                                                                    >/70</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 52.9%;
                                                                                    background: var(
                                                                                        --fat
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mgrid wdg-lim wdg-sec"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Sugar</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >6.5</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 14.4%;
                                                                                    background: var(
                                                                                        --sug
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limit
                                                                            45 g
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Caffeine</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >95</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 23.8%;
                                                                                    background: var(
                                                                                        --caf
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limit
                                                                            400
                                                                            mg
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Fiber</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >15.4</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 51.3%;
                                                                                    background: var(
                                                                                        --fib
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            of
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Tap a metric
                                                                    for the
                                                                    meals behind
                                                                    it
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            class="wdg-wrow wdg-sec"
                                                        >
                                                            <span
                                                                class="wdg-wlab"
                                                                ><span
                                                                    class="wdg-dot"
                                                                    style="
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></span
                                                                >Water</span
                                                            >
                                                            <div
                                                                class="wdg-mbar"
                                                            >
                                                                <div
                                                                    class="wdg-mfill"
                                                                    style="
                                                                        width: 48%;
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></div>
                                                            </div>
                                                            <span
                                                                class="wdg-wnum"
                                                                >1.2<span
                                                                    class="wdg-wsub"
                                                                    >/2.5
                                                                    L</span
                                                                ></span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                                Got it — added a chicken burrito
                                                bowl to lunch, about 650 kcal
                                                (42g protein, 68g carbs, 22g
                                                fat) and 12g of fiber from the
                                                beans.
                                            </div>`;
const SLIDE_2_HTML_PLACEHOLDER = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Photo of a dinner plate"
                                                >
                                                    <rect
                                                        width="220"
                                                        height="150"
                                                        fill="#efe9df"
                                                    />
                                                    <ellipse
                                                        cx="110"
                                                        cy="82"
                                                        rx="72"
                                                        ry="52"
                                                        fill="#fbfaf7"
                                                    />
                                                    <ellipse
                                                        cx="110"
                                                        cy="82"
                                                        rx="72"
                                                        ry="52"
                                                        fill="none"
                                                        stroke="#e6e0d3"
                                                        stroke-width="2.5"
                                                    />
                                                    <ellipse
                                                        cx="110"
                                                        cy="82"
                                                        rx="58"
                                                        ry="41"
                                                        fill="none"
                                                        stroke="#efe9df"
                                                        stroke-width="1.5"
                                                    />
                                                    <ellipse
                                                        cx="136"
                                                        cy="64"
                                                        rx="28"
                                                        ry="19"
                                                        fill="#f3efe6"
                                                    />
                                                    <ellipse
                                                        cx="136"
                                                        cy="64"
                                                        rx="28"
                                                        ry="19"
                                                        fill="none"
                                                        stroke="#e7e1d4"
                                                        stroke-width="1"
                                                    />
                                                    <g fill="#ffffff">
                                                        <circle
                                                            cx="126"
                                                            cy="60"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="138"
                                                            cy="58"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="146"
                                                            cy="66"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="132"
                                                            cy="70"
                                                            r="1.6"
                                                        />
                                                        <circle
                                                            cx="142"
                                                            cy="68"
                                                            r="1.6"
                                                        />
                                                    </g>
                                                    <g
                                                        transform="rotate(-16 86 92)"
                                                    >
                                                        <rect
                                                            x="58"
                                                            y="80"
                                                            width="56"
                                                            height="26"
                                                            rx="9"
                                                            fill="#e0916b"
                                                        />
                                                        <rect
                                                            x="64"
                                                            y="86"
                                                            width="44"
                                                            height="3"
                                                            rx="1.5"
                                                            fill="#edb293"
                                                        />
                                                        <rect
                                                            x="64"
                                                            y="92"
                                                            width="44"
                                                            height="3"
                                                            rx="1.5"
                                                            fill="#edb293"
                                                        />
                                                        <rect
                                                            x="64"
                                                            y="98"
                                                            width="44"
                                                            height="3"
                                                            rx="1.5"
                                                            fill="#edb293"
                                                        />
                                                    </g>
                                                    <g>
                                                        <rect
                                                            x="128"
                                                            y="98"
                                                            width="4"
                                                            height="12"
                                                            rx="2"
                                                            fill="#9ab98a"
                                                        />
                                                        <circle
                                                            cx="124"
                                                            cy="98"
                                                            r="10"
                                                            fill="#5f8f4e"
                                                        />
                                                        <circle
                                                            cx="136"
                                                            cy="95"
                                                            r="8.5"
                                                            fill="#6fa35d"
                                                        />
                                                        <circle
                                                            cx="133"
                                                            cy="105"
                                                            r="7.5"
                                                            fill="#537f44"
                                                        />
                                                        <circle
                                                            cx="121"
                                                            cy="106"
                                                            r="6.5"
                                                            fill="#6a9a58"
                                                        />
                                                    </g>
                                                </svg>
                                            </div>
                                            <div class="msg msg-user">
                                                Here's my dinner — what's in it?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Looks like grilled salmon with
                                                rice and broccoli — logged to
                                                dinner, around 540 kcal (38g
                                                protein, 45g carbs, 20g fat).
                                            </div>`;
const SLIDE_3_HTML_PLACEHOLDER = `
                                            <div
                                                class="msg-img"
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 220 150"
                                                    class="chat-photo"
                                                    role="img"
                                                    aria-label="Photo of a product barcode"
                                                >
                                                    <rect
                                                        width="220"
                                                        height="150"
                                                        fill="#efe9df"
                                                    />
                                                    <rect
                                                        x="40"
                                                        y="32"
                                                        width="140"
                                                        height="86"
                                                        rx="12"
                                                        fill="#ffffff"
                                                        stroke="#e6e0d3"
                                                        stroke-width="2"
                                                    />
                                                    <g>
                                                        <rect
                                                            x="53"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="58.6"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="62.2"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="66.8"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="70.39999999999999"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="73.99999999999999"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="79.59999999999998"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="84.19999999999997"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="87.79999999999997"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="92.39999999999996"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="95.99999999999996"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="101.59999999999995"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="105.19999999999995"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="108.79999999999994"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="113.39999999999993"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="117.99999999999993"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="121.59999999999992"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="127.19999999999992"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="130.79999999999993"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="135.39999999999992"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="138.99999999999991"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="142.5999999999999"
                                                            y="50"
                                                            width="2"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="147.1999999999999"
                                                            y="50"
                                                            width="3"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                        <rect
                                                            x="152.7999999999999"
                                                            y="50"
                                                            width="1"
                                                            height="44"
                                                            fill="#2b2b2b"
                                                        />
                                                    </g>
                                                    <text
                                                        x="110"
                                                        y="108"
                                                        text-anchor="middle"
                                                        font-family="ui-monospace, monospace"
                                                        font-size="10"
                                                        letter-spacing="2"
                                                        fill="#9a9a9f"
                                                    >
                                                        0 12345 67890
                                                    </text>
                                                </svg>
                                            </div>
                                            <div class="msg msg-user">
                                                Log this
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai step-ask">
                                                Found it — Chobani Greek yogurt,
                                                1 cup: 120 kcal, 15g protein.
                                                Which meal is this?
                                                <div class="meal-pick">
                                                    <span class="meal-chip"
                                                        >Breakfast</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Lunch</span
                                                    >
                                                    <span class="meal-chip"
                                                        >Dinner</span
                                                    >
                                                    <span
                                                        class="meal-chip meal-pick-target"
                                                        >Snack</span
                                                    >
                                                </div>
                                            </div>
                                            <div class="msg msg-ai step-done">
                                                <div class="wdg">
                                                    <div class="wdg-head">
                                                        <div class="wdg-title">
                                                            Meal logged
                                                        </div>
                                                        <div class="wdg-sub">
                                                            Chobani Greek
                                                            yogurt, 1 cup ·
                                                            snack
                                                        </div>
                                                        <div
                                                            class="wdg-meta wdg-kcal"
                                                        >
                                                            +120 kcal
                                                        </div>
                                                    </div>
                                                    <div class="wdg-strip">
                                                        <div class="wdg-srow">
                                                            <div
                                                                class="wdg-cal"
                                                            >
                                                                <div
                                                                    class="wdg-gauge"
                                                                >
                                                                    <div
                                                                        class="wdg-ring"
                                                                        style="
                                                                            --c: var(
                                                                                --cal
                                                                            );
                                                                            --p: 73;
                                                                        "
                                                                    ></div>
                                                                    <div
                                                                        class="wdg-rc"
                                                                    >
                                                                        <span
                                                                            class="wdg-rp"
                                                                            style="
                                                                                color: var(
                                                                                    --cal
                                                                                );
                                                                            "
                                                                            >73%</span
                                                                        >
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-caltxt"
                                                                >
                                                                    <div
                                                                        class="wdg-callab"
                                                                    >
                                                                        Calories
                                                                        today
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1,540<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2,100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            560
                                                                            kcal
                                                                            left
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-grids"
                                                            >
                                                                <div
                                                                    class="wdg-mgrid"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Protein</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >98<span
                                                                                    class="wdg-msub"
                                                                                    >/150</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 65.3%;
                                                                                    background: var(
                                                                                        --pro
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Carbs</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >150<span
                                                                                    class="wdg-msub"
                                                                                    >/220</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 68.2%;
                                                                                    background: var(
                                                                                        --car
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Fat</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >52<span
                                                                                    class="wdg-msub"
                                                                                    >/70</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 74.3%;
                                                                                    background: var(
                                                                                        --fat
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mgrid wdg-lim wdg-sec"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Sugar</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >28.4</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 63.1%;
                                                                                    background: var(
                                                                                        --sug
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limit
                                                                            45 g
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Caffeine</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >95</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 23.8%;
                                                                                    background: var(
                                                                                        --caf
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limit
                                                                            400
                                                                            mg
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Fiber</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >19.2</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 64%;
                                                                                    background: var(
                                                                                        --fib
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            of
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mhint"
                                                                    aria-hidden="true"
                                                                >
                                                                    Tap a metric
                                                                    for the
                                                                    meals behind
                                                                    it
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                Logged to snacks — 120 kcal, 15g
                                                protein, 9g sugar.
                                            </div>`;
const SLIDE_4_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Set my timezone to New York
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                Done — your days now roll over
                                                at midnight Eastern, so today's
                                                totals stay accurate wherever
                                                you are.
                                            </div>`;
const SLIDE_5_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                How am I doing on protein today?
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                You're at 118g of your 150g goal
                                                — 32g to go. A cup of Greek
                                                yogurt or a chicken breast would
                                                get you there.
                                            </div>`;
const SLIDE_6_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Show my trends this week
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                <div class="wdg">
                                                    <div
                                                        class="wdg-head wdg-mid"
                                                    >
                                                        <div class="wdg-title">
                                                            Trends
                                                        </div>
                                                        <div
                                                            class="wdg-seg"
                                                            aria-hidden="true"
                                                        >
                                                            <span
                                                                class="wdg-seg-btn wdg-on"
                                                                >7</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >14</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >30</span
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="wdg-chart">
                                                        <div class="wdg-chead">
                                                            <span
                                                                class="wdg-ctitle"
                                                                >Calories /
                                                                day</span
                                                            >
                                                            <span
                                                                class="wdg-cmeta"
                                                                >7/7 days
                                                                logged</span
                                                            >
                                                        </div>
                                                        <svg
                                                            viewBox="0 0 480 54"
                                                            role="img"
                                                            aria-label="Calories per day over the last 7 days"
                                                        >
                                                            <line
                                                                class="wdg-axis"
                                                                x1="8"
                                                                y1="50"
                                                                x2="472"
                                                                y2="50"
                                                            />
                                                            <line
                                                                class="wdg-goalline"
                                                                x1="8"
                                                                y1="11.7"
                                                                x2="472"
                                                                y2="11.7"
                                                            />
                                                            <path
                                                                d="M8.0 50 L8.0 13.2 L85.3 14.7 L162.7 11.9 L240.0 15.7 L317.3 13.4 L394.7 14.4 L472.0 14.2 L472.0 50 Z"
                                                                fill="var(--cal)"
                                                                opacity="0.16"
                                                            />
                                                            <path
                                                                d="M8.0 13.2 L85.3 14.7 L162.7 11.9 L240.0 15.7 L317.3 13.4 L394.7 14.4 L472.0 14.2"
                                                                fill="none"
                                                                stroke="var(--cal)"
                                                                stroke-width="2"
                                                                stroke-linejoin="round"
                                                                stroke-linecap="round"
                                                            />
                                                            <circle
                                                                cx="8.0"
                                                                cy="13.2"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="85.3"
                                                                cy="14.7"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="162.7"
                                                                cy="11.9"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="240.0"
                                                                cy="15.7"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="317.3"
                                                                cy="13.4"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="394.7"
                                                                cy="14.4"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                            <circle
                                                                cx="472.0"
                                                                cy="14.2"
                                                                r="2.2"
                                                                fill="var(--cal)"
                                                            />
                                                        </svg>
                                                        <div class="wdg-tdates">
                                                            <span>07-05</span
                                                            ><span>07-11</span>
                                                        </div>
                                                    </div>
                                                    <div
                                                        class="wdg-strip wdg-sec"
                                                    >
                                                        <div class="wdg-srow">
                                                            <div
                                                                class="wdg-cal"
                                                            >
                                                                <div
                                                                    class="wdg-gauge"
                                                                >
                                                                    <div
                                                                        class="wdg-ring"
                                                                        style="
                                                                            --c: var(
                                                                                --cal
                                                                            );
                                                                            --p: 94;
                                                                        "
                                                                    ></div>
                                                                    <div
                                                                        class="wdg-rc"
                                                                    >
                                                                        <span
                                                                            class="wdg-rp"
                                                                            style="
                                                                                color: var(
                                                                                    --cal
                                                                                );
                                                                            "
                                                                            >94%</span
                                                                        >
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-caltxt"
                                                                >
                                                                    <div
                                                                        class="wdg-callab"
                                                                    >
                                                                        7-day
                                                                        avg ·
                                                                        all days
                                                                    </div>
                                                                    <div
                                                                        class="wdg-calline"
                                                                    >
                                                                        <div
                                                                            class="wdg-calval"
                                                                        >
                                                                            1,980<span
                                                                                class="wdg-calgoal"
                                                                                >/
                                                                                2,100</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-calleft"
                                                                        >
                                                                            120
                                                                            kcal
                                                                            under
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div
                                                                class="wdg-grids"
                                                            >
                                                                <div
                                                                    class="wdg-mgrid"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Protein</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >148<span
                                                                                    class="wdg-msub"
                                                                                    >/150</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 98.7%;
                                                                                    background: var(
                                                                                        --pro
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Carbs</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >205<span
                                                                                    class="wdg-msub"
                                                                                    >/220</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 93.2%;
                                                                                    background: var(
                                                                                        --car
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Fat</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >66<span
                                                                                    class="wdg-msub"
                                                                                    >/70</span
                                                                                ></span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 94.3%;
                                                                                    background: var(
                                                                                        --fat
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    class="wdg-mgrid wdg-lim wdg-sec"
                                                                >
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Sugar</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >38.2</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 84.9%;
                                                                                    background: var(
                                                                                        --sug
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limit
                                                                            45 g
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Caffeine</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >180</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 45%;
                                                                                    background: var(
                                                                                        --caf
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            limit
                                                                            400
                                                                            mg
                                                                        </div>
                                                                    </div>
                                                                    <div
                                                                        class="wdg-mtile"
                                                                    >
                                                                        <div
                                                                            class="wdg-mtop"
                                                                        >
                                                                            <span
                                                                                class="wdg-mkey"
                                                                                >Fiber</span
                                                                            >
                                                                            <span
                                                                                class="wdg-mnum"
                                                                                >26.8</span
                                                                            >
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mbar"
                                                                        >
                                                                            <div
                                                                                class="wdg-mfill"
                                                                                style="
                                                                                    width: 89.3%;
                                                                                    background: var(
                                                                                        --fib
                                                                                    );
                                                                                "
                                                                            ></div>
                                                                        </div>
                                                                        <div
                                                                            class="wdg-mcap"
                                                                        >
                                                                            of
                                                                            30 g
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div
                                                            class="wdg-wrow wdg-sec"
                                                        >
                                                            <span
                                                                class="wdg-wlab"
                                                                ><span
                                                                    class="wdg-dot"
                                                                    style="
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></span
                                                                >Water</span
                                                            >
                                                            <div
                                                                class="wdg-mbar"
                                                            >
                                                                <div
                                                                    class="wdg-mfill"
                                                                    style="
                                                                        width: 84%;
                                                                        background: var(
                                                                            --wat
                                                                        );
                                                                    "
                                                                ></div>
                                                            </div>
                                                            <span
                                                                class="wdg-wnum"
                                                                >2.1<span
                                                                    class="wdg-wsub"
                                                                    >/2.5
                                                                    L</span
                                                                ></span
                                                            >
                                                        </div>
                                                    </div>
                                                </div>
                                                You're averaging 1,980 kcal a
                                                day — 120 under goal, with sugar
                                                and caffeine both comfortably
                                                inside your limits. Fiber is
                                                averaging 26.8 g, just short of
                                                your 30 g goal.
                                            </div>`;
const SLIDE_7_HTML_PLACEHOLDER = `
                                            <div class="msg msg-user">
                                                Log my weight, 74.5 kg
                                            </div>
                                            <div
                                                class="typing"
                                                aria-hidden="true"
                                            >
                                                <span></span><span></span
                                                ><span></span>
                                            </div>
                                            <div class="msg msg-ai">
                                                <div class="wdg">
                                                    <div
                                                        class="wdg-head wdg-mid"
                                                    >
                                                        <div class="wdg-title">
                                                            Weight
                                                        </div>
                                                        <div
                                                            class="wdg-seg"
                                                            aria-hidden="true"
                                                        >
                                                            <span
                                                                class="wdg-seg-btn wdg-on"
                                                                >7</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >14</span
                                                            >
                                                            <span
                                                                class="wdg-seg-btn"
                                                                >30</span
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="wdg-wmain">
                                                        <div class="wdg-wnow">
                                                            <div
                                                                class="wdg-wtag"
                                                            >
                                                                Latest
                                                            </div>
                                                            <div
                                                                class="wdg-wval"
                                                            >
                                                                74.5<span
                                                                    class="wdg-wunit"
                                                                    >kg</span
                                                                >
                                                            </div>
                                                            <div
                                                                class="wdg-wdelta"
                                                                style="
                                                                    color: var(
                                                                        --accent
                                                                    );
                                                                "
                                                            >
                                                                −0.6 kg since 5
                                                                Jul
                                                            </div>
                                                        </div>
                                                        <svg
                                                            class="wdg-wchart"
                                                            viewBox="0 0 300 62"
                                                            role="img"
                                                            aria-label="Weight from 5 Jul to 11 Jul, latest 74.5 kg"
                                                        >
                                                            <line
                                                                class="wdg-goalline"
                                                                x1="5"
                                                                y1="50.4"
                                                                x2="295"
                                                                y2="50.4"
                                                            />
                                                            <path
                                                                d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1 L295.0 57 L5.0 57 Z"
                                                                fill="var(--accent)"
                                                                opacity="0.16"
                                                            />
                                                            <path
                                                                d="M5.0 13.6 L53.3 15.4 L101.7 18.9 L150.0 17.1 L198.3 22.4 L246.7 20.6 L295.0 24.1"
                                                                fill="none"
                                                                stroke="var(--accent)"
                                                                stroke-width="2"
                                                                stroke-linejoin="round"
                                                                stroke-linecap="round"
                                                            />
                                                            <circle
                                                                cx="5.0"
                                                                cy="13.6"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="53.3"
                                                                cy="15.4"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="101.7"
                                                                cy="18.9"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="150.0"
                                                                cy="17.1"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="198.3"
                                                                cy="22.4"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="246.7"
                                                                cy="20.6"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                            <circle
                                                                cx="295.0"
                                                                cy="24.1"
                                                                r="2.6"
                                                                fill="var(--accent)"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div
                                                        class="wdg-sec wdg-wfoot"
                                                    >
                                                        <span
                                                            >7 weigh-ins · 5 Jul
                                                            → 11 Jul</span
                                                        >
                                                        <span
                                                            ><b
                                                                >Target 73.0
                                                                kg</b
                                                            >
                                                            · 1.5 kg to
                                                            lose</span
                                                        >
                                                    </div>
                                                </div>
                                                Logged — you're trending toward
                                                your goal.
                                            </div>`;

const INDEX_EN: IndexDoc = {
    title: "Nutrition MCP — AI Meal & Macro Tracker for Claude & ChatGPT",
    metaDescription:
        "Track meals, macros, weight, and nutrition history through conversation with Claude or ChatGPT. Free MCP server for AI-powered food logging, barcode scanning, calorie counting, weight tracking, and diet tracking.",
    ogDescription:
        "Track meals, macros, weight, and nutrition history through conversation with Claude or ChatGPT. Free MCP server for AI-powered food logging, barcode scanning, and weight tracking.",
    keywords:
        "nutrition tracker, meal tracker, MCP server, Claude AI, ChatGPT, calorie counter, macro tracker, barcode scanner, food logging, diet tracker, weight tracker, weight log, AI nutrition, Model Context Protocol",

    chatChrome: {
        brand: "Nutrition MCP",
        status: "online",
        inputPlaceholder: "Message Nutrition…",
    },

    hero: {
        eyebrow: "Free · Open source · OAuth 2.0",
        titleBeforeEm: "Track your nutrition by ",
        titleEm: "talking",
        titleAfterEm: " to your AI.",
        lead: "Connect Claude or ChatGPT, then just say what you ate. Calories and macros, logged automatically.",
        ctaPrimary: "Quick install",
        ctaSecondary: "Support",
        chipsHtml: HERO_CHIPS_HTML_PLACEHOLDER,
        chatHtml: HERO_CHAT_HTML_PLACEHOLDER,
    },

    how: {
        eyebrow: "How it works",
        title: "Three steps. No app to learn.",
        steps: [
            {
                title: "Connect once",
                body: "Works with any AI client that supports remote MCP servers — Claude, ChatGPT, and more. No install, no API keys.",
            },
            {
                title: "Just say what you ate",
                body: "Describe it in plain language — or send a photo of your meal, a screenshot from a delivery app, or a barcode (it looks the product up online). Macros logged automatically.",
            },
            {
                title: "Track & review",
                body: "Ask for daily summaries, weekly trends, goal progress, or export everything you've logged as CSV files — completely free.",
            },
        ],
    },

    install: {
        eyebrow: "Quick install",
        title: "Connect in under a minute",
        sub: "Works with any MCP client that supports OAuth 2.0 with PKCE. On first connect you create an account with Google or an email and password; sign in the same way to keep your data.",
        claude: {
            steps: [
                "Open <strong>Claude</strong> (web or desktop) and click <strong>Customize</strong> in the top-left corner.",
                "Click <strong>Connectors</strong>.",
                "Click <strong>+</strong>, then <strong>Add custom connector</strong>.",
                "Give it a name, for example <strong>Nutrition</strong>.",
                'Paste <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Copy server URL"><i class="fa-solid fa-copy"></i></button></span> into the <strong>Remote MCP server URL</strong> field.',
                "Click <strong>Add</strong>.",
                "Click <strong>Connect</strong> — the login page opens; continue with Google or sign in with an email and password.",
                "Done. It works right away and shows up in your iOS and Android apps automatically.",
            ],
            note: "Works on every Claude plan. The free plan allows one connected MCP server at a time.",
        },
        chatgpt: {
            steps: [
                "Open <strong>ChatGPT on the web</strong> → <strong>Settings</strong> → <strong>Apps</strong>.",
                "Click <strong>Create app</strong> at the bottom of the popup. If you don't see it, turn on <strong>Developer mode</strong> in <strong>Advanced settings</strong>.",
                "Give it a name, for example <strong>Nutrition</strong>.",
                'For <strong>Connection</strong>, paste <span class="copy-url"><code>https://nutrition-mcp.com/mcp</code><button class="copy-mini" type="button" data-copy="https://nutrition-mcp.com/mcp" aria-label="Copy server URL"><i class="fa-solid fa-copy"></i></button></span>.',
                "For <strong>Authentication</strong>, choose <strong>OAuth</strong> — leave everything else as it is.",
                'Check <strong>"I understand and want to continue"</strong>.',
                "Click <strong>Create</strong>.",
                "Click <strong>Sign in with Nutrition</strong> — the login page opens; continue with Google or sign in with an email and password.",
                "Done. It works right away and shows up in your iOS and Android apps automatically.",
            ],
        },
        other: {
            note: "Add the config above to your client (Cursor, VS Code, Claude Code, and more). Windsurf uses <code>serverUrl</code> instead of <code>url</code>. In Claude Code, run <code>claude mcp add --transport http nutrition https://nutrition-mcp.com/mcp</code>. Your client handles the OAuth login automatically.",
        },
        otherTabLabel: "Other agents",
    },

    onboarding: {
        eyebrow: "Onboarding",
        title: "Set up once — or just start talking",
        sub: "This is completely optional — Nutrition MCP works the moment you connect. If you want, these three quick steps make it more accurate, but you can skip straight to logging.",
        steps: [
            '<strong>Set your timezone</strong> — so days roll over at your local midnight and today\'s totals stay accurate wherever you are. <span class="step-say">Just say <q>Set my timezone to New York</q>.</span>',
            '<strong>Set your goals</strong> — daily calorie, macro, and water targets, plus an optional target weight and your preferred weight unit (kg or lb), to track your progress against. <span class="step-say">Just say <q>Set my daily goal to 2,000 calories and 150g of protein</q>.</span>',
            '<strong>Set your language</strong> — the language in-chat widgets (dashboards, charts) are shown in, not what the AI writes back to you. <span class="step-say">Just say <q>Show my widgets in German</q>.</span>',
            '<strong>Start logging</strong> — just say what you ate, send a photo or scan a barcode. That\'s it. <span class="step-say">Just say <q>I had oatmeal with berries for breakfast</q>.</span>',
        ],
        note: "Everything here is optional. You can do it now, later, or never — just start logging and set these whenever you like.",
        toolsCta: {
            heading: "Curious what it can actually do?",
            body: "Browse all 36 tools — logging, barcodes, water, weight, goals, and trends — with a description and an example prompt for each.",
            arrow: "Explore the tools",
        },
    },

    try: {
        eyebrow: "Try saying",
        title: "Just talk to it.",
        sub: "A few of the things you can do — just by talking.",
        prevLabel: "Previous example",
        nextLabel: "Next example",
        exampleLabel: "Example",
        slides: [
            { html: SLIDE_1_HTML_PLACEHOLDER },
            { html: SLIDE_2_HTML_PLACEHOLDER },
            { html: SLIDE_3_HTML_PLACEHOLDER },
            { html: SLIDE_4_HTML_PLACEHOLDER },
            { html: SLIDE_5_HTML_PLACEHOLDER },
            { html: SLIDE_6_HTML_PLACEHOLDER },
            { html: SLIDE_7_HTML_PLACEHOLDER },
        ],
    },

    stats: {
        eyebrow: "Tracked so far, together",
        title: "A growing global food log",
        factsTitle: "Nutrition Facts",
        servingPrefix: "Serving size ",
        servingBold: "everyone, so far",
        liveLabel: "Live",
        calLabel: "Calories ",
        calSmall: "tracked, all time",
        calCaption: "Calories tracked",
        rowFoodLogs: "Food logs",
        rowProtein: "Protein",
        rowCarbs: "Carbohydrates",
        rowFat: "Fat",
        unitGroupLabel: "Weight unit",
        unitKgLabel: "Kilograms (kg)",
        unitLbLabel: "Pounds (lb)",
        foot: "Totals across every account, updated as meals are logged. Individual data is never shown.",
        mapPrefix: "Logged across",
        mapSuffix: "timezones worldwide",
        mapAriaLabel: "World map showing timezones where Nutrition MCP is used",
    },

    features: {
        eyebrow: "Everything, just by chatting",
        title: "What you can track",
        cards: [
            {
                icon: "fa-solid fa-utensils",
                title: "Meals in plain language",
                body: "Describe what you ate — your AI estimates calories, protein, carbs, fat, fiber, total sugar, and caffeine in milligrams and logs it.",
            },
            {
                icon: "fa-solid fa-barcode",
                title: "Scan a barcode",
                body: "Snap or type a product barcode and pull macros, fiber, and sugar from Open Food Facts, scaled to how much you ate.",
            },
            {
                icon: "fa-solid fa-bullseye",
                title: "Goals & progress",
                body: "Set daily calorie, macro, fiber, and water targets — plus sugar, caffeine, and alcohol limits to stay under — and check live progress toward them.",
            },
            {
                icon: "fa-solid fa-chart-area",
                title: "Summaries & trends",
                body: "Daily and weekly breakdowns, 7/14/30-day trends, streaks, and recurring meal patterns.",
            },
            {
                icon: "fa-solid fa-glass-water",
                title: "Water logging",
                body: "Track hydration in milliliters alongside your meals and review it by day.",
            },
            {
                icon: "fa-solid fa-weight-scale",
                title: "Weight tracking",
                body: "Log your body weight in kg or lb, see 7/14/30-day trends, and track progress toward a target weight.",
            },
            {
                icon: "fa-solid fa-clock-four",
                title: "Timezone-aware",
                body: "Days roll over in your local time, wherever you are in the world.",
            },
            {
                icon: "fa-solid fa-file-import",
                title: "Import from another app",
                body: "Bring your meal history over from MyFitnessPal, Cronometer, Lose It!, or MacroFactor — or any other CSV, by mapping its columns yourself. You confirm what gets added before anything is saved.",
            },
            {
                icon: "fa-solid fa-file-csv",
                title: "Export & own your data",
                body: "Take everything you have here — meals, water, weight, goals, and profile — as one ZIP of CSV files. Meals are the only part that can be imported back in for now. Delete your account and data whenever you want.",
            },
        ],
    },

    why: {
        eyebrow: "Why Nutrition MCP",
        title: "Talking beats tapping.",
        sub: "Snap a barcode or just say what you ate — no database digging, no separate app to open.",
        oldHeading: "Traditional apps",
        oldItems: [
            "Search a database for every item",
            "Fix wrong database entries by hand",
            "Yet another app, account, and paywall",
            "Tedious manual logging",
        ],
        newHeading: "Nutrition MCP",
        newItems: [
            "Describe meals in plain language",
            "Calories & macros estimated for you",
            "Works inside Claude or ChatGPT, free",
            "Ask for trends, summaries, and goals",
        ],
        noteHtml:
            'Switching from a specific app? See how Nutrition MCP compares to <a href="/alternatives" data-link="alternatives">MyFitnessPal, Cronometer, and other trackers</a>.',
    },

    trust: [
        { label: "Private by default", small: "Only you can see your data." },
        { label: "Open source", small: "Audit or self-host it." },
        {
            label: "Export anytime",
            small: "Every table as CSV, in one ZIP.",
        },
        { label: "Delete instantly", small: "Remove your account & data." },
    ],

    support: {
        eyebrow: "Support",
        title: "Help keep it running.",
        sub: "Nutrition MCP is free and ad-free. Patreon covers the server and database bills.",
        updatesTitle: "Latest from Patreon",
        updatesNote: "Free to read — no membership needed.",
        updatesPrevLabel: "Previous update",
        updatesNextLabel: "Next update",
        updatesDotLabel: "Update",
        free: {
            tier: "Free member",
            price: "$0",
            desc: "Follow along — get news and updates about the server, new tools, and what's coming next.",
            cta: "Follow on Patreon",
        },
        paid: {
            tier: "Paid member",
            price: "Pay what you want",
            desc: "Chip in for hosting and database costs so the server stays free and online for everyone.",
            cta: "Become a supporter",
        },
    },

    cta: {
        title: "Start tracking in under a minute.",
        sub: "Free and open source — it works with the AI you already use.",
        primary: "Quick install",
        secondary: "Star on GitHub",
    },

    contact: {
        eyebrow: "Contact",
        title: "Questions or feedback?",
        sub: "Found a bug, want a feature, or just have a question? Email me directly — I read every message.",
        cta: "Send an email",
    },

    faqSection: {
        eyebrow: "FAQ",
        title: "Frequently asked questions",
    },
    faq: [
        {
            question: "What is Nutrition MCP?",
            visibleHtml:
                "Nutrition MCP is a free Model Context Protocol (MCP) server that lets you track meals, calories, macros, and nutrition history through natural conversation with Claude or ChatGPT. Instead of typing into a traditional app, you tell your AI what you ate and it logs everything for you.",
        },
        {
            question: "What is the Model Context Protocol (MCP)?",
            visibleHtml:
                "The Model Context Protocol is an open standard that lets AI assistants like Claude and ChatGPT connect to external tools and data sources. An MCP server provides specific capabilities — here, nutrition tracking — that the AI can use during a conversation. Think of it as a plugin system for AI assistants.",
        },
        {
            // The visible answer deliberately omits the server URL (already
            // stated elsewhere on the page); the JSON-LD answer, read
            // standalone by search engines, states it explicitly. This
            // mismatch predates this extraction — preserved verbatim rather
            // than silently reconciled.
            question: "Does it work with ChatGPT?",
            visibleHtml:
                "Yes. In ChatGPT on the web, open Settings → Apps, create a custom app with the server URL using OAuth, and sign in. It works on every ChatGPT plan.",
            jsonLdText:
                "Yes. In ChatGPT on the web, open Settings → Apps, create a custom app with the server URL https://nutrition-mcp.com/mcp using OAuth, and sign in. It works on every ChatGPT plan.",
        },
        {
            question: "Which other clients are supported?",
            visibleHtml:
                "Any MCP client that supports OAuth 2.0 with PKCE — including Claude.ai, the Claude desktop and mobile apps, Claude Code, Cursor, Windsurf, and VS Code.",
        },
        {
            question: "Can I self-host it?",
            visibleHtml:
                'Yes. Nutrition MCP is open source (MIT). You can run your own instance with your own Supabase project — the <a href="https://github.com/akutishevsky/nutrition-mcp" target="_blank" rel="noopener noreferrer">GitHub repository</a> includes a full self-hosting guide and a Dockerfile.',
        },
        {
            question: "Is Nutrition MCP free?",
            visibleHtml:
                "Yes, it is completely free — no premium tiers, ads, or hidden costs. You just need a Claude or ChatGPT account to connect. Donations on Patreon help cover server costs.",
        },
        {
            question: "What can I track?",
            visibleHtml:
                "Calories, protein, carbohydrates, fat, fiber, total sugar, and water for every entry — described in plain language or pulled from a product barcode via Open Food Facts. Caffeine is tracked too, in milligrams, the unit every label uses, and it adds no calories. Alcohol is tracked as well, in grams of pure ethanol, once you switch it on. You can also log your body weight in kg or lb and track trends toward a target weight. View daily summaries, query meals by date range, update or delete past entries, set goals, and monitor trends over time.",
        },
        {
            question: "Does it track alcohol?",
            visibleHtml:
                "Only if you turn it on — alcohol tracking is off by default. Switched on, drinks are recorded in grams of pure ethanol and shown as US standard drinks or UK units, whichever you prefer. Nothing infers alcohol for you: it comes from a drink you log or an alcohol column in a file you import. Switching it back off hides alcohol from your meals, goals, and summaries and stops the importer reading alcohol columns — it is not a delete switch, and your CSV export always includes what you logged.",
        },
        {
            question:
                "Can I import my history from MyFitnessPal or another app?",
            visibleHtml:
                "Yes. Ask to import your history and an importer opens in the chat: you pick the CSV your old app exported, check how its columns map, and see what will be added before confirming. Exports from MyFitnessPal, Cronometer, Lose It!, and MacroFactor are recognised automatically, and any other CSV works by mapping the columns yourself. Your browser reads the file, so the AI never retypes your rows. In clients without in-chat panels you can paste your export instead — and importing the same file twice does not create duplicates.",
        },
        {
            question: "Is my data private?",
            visibleHtml:
                "Your data is stored securely and linked to your personal account. Only you can access your nutrition history through your authenticated session. Nutrition MCP does not sell or share your data, and you can delete your account and all data at any time.",
        },
    ],
};

export const INDEX: Partial<Record<SiteLocale, IndexDoc>> = {
    en: INDEX_EN,
    de: INDEX_DE,
    es: INDEX_ES,
    fr: INDEX_FR,
    nl: INDEX_NL,
    pl: INDEX_PL,
    it: INDEX_IT,
    uk: INDEX_UK,
    ja: INDEX_JA,
};
