// Typed content for /tools (the "all 48 tools" reference page), rendered
// by scripts/gen-tools.ts. Extracted verbatim from the previously
// hand-authored public/tools.html — see CLAUDE.md's "Public site" section
// for the generator family this belongs to, and gen-tools.ts's own header
// for how it plugs into that family.
//
// The split below matters for the translation pass that follows this one:
// a tool's IDENTITY — its literal MCP tool name, each param's literal API
// field name, which category it lives in, and which badge chips it shows
// — is structural and shared by every locale untranslated (TOOLS, plus
// BADGE_META's CSS/icon wiring). Only PROSE — descriptions, param
// descriptions, "try saying" examples, category copy, hero copy, and the
// badge label text itself — lives inside ToolsDoc, one entry per locale in
// TOOLS_COPY. A future translation pass reads ToolsDoc's shape and fills
// in a new locale; it should never need to touch TOOLS or BADGE_META.
//
// Nearly every prose field here is plain text, escaped by the generator
// via esc() — same as a LegalDoc section heading. The one exception is
// ToolProse.params: a handful of parameter descriptions carry inline
// <b>/<code> markup (e.g. "<b>Total</b> sugars...", listing sibling
// `<code>param_name</code>` identifiers inline in a sentence), so every
// param description is a trusted HTML string instead — same trust model
// as src/copy/legal.ts: developer-authored constants, not escaped
// further. A markup-free description (most of them) is simply written as
// plain characters with nothing that needs escaping.

import type { SiteLocale } from "../routes.js";
import { TOOLS_DE } from "./tools.de.js";
import { TOOLS_ES } from "./tools.es.js";
import { TOOLS_FR } from "./tools.fr.js";
import { TOOLS_NL } from "./tools.nl.js";
import { TOOLS_PL } from "./tools.pl.js";
import { TOOLS_IT } from "./tools.it.js";
import { TOOLS_UK } from "./tools.uk.js";
import { TOOLS_JA } from "./tools.ja.js";
import { TOOLS_TR } from "./tools.tr.js";

// ------------------------------------------------------------- identity

/** The 7 tool categories, in page order — matches both the category
 * jump-bar and the order the tool-group sections appear in below it. */
export type CategoryId =
    | "logging-food-meals"
    | "reviewing-your-meals"
    | "water"
    | "weight"
    | "goals-progress"
    | "insights-trends"
    | "settings-account";

/** Badge ("chip") kinds shown in a tool card's header. Whether a kind
 * renders accent or grey is decided in scripts/gen-tools.ts
 * (ACCENT_BADGES), the optional icon in BADGE_META below, and the
 * (locale-translatable) label text in ToolsDoc.badges, kept once there
 * rather than per tool. */
export type BadgeKind =
    | "log"
    | "import"
    | "edit"
    | "setting"
    | "lookup"
    | "view"
    | "export"
    | "remove"
    | "widget";

/** Optional Font Awesome icon per badge kind — structural, identical
 * across every locale, so it lives beside TOOLS rather than inside
 * ToolsDoc. */
export const BADGE_META: Record<BadgeKind, { icon?: string }> = {
    log: {},
    import: {},
    edit: {},
    setting: {},
    lookup: {},
    view: {},
    export: {},
    remove: {},
    widget: { icon: "fa-solid fa-table-cells-large" },
};

/** The 7 categories in page order, and each one's Font Awesome icon class
 * — structural, identical across every locale (same reasoning as
 * BADGE_META: the icon and ordering never change with translation, only
 * CategoryProse's pillLabel/title/description do). */
export const CATEGORIES: CategoryId[] = [
    "logging-food-meals",
    "reviewing-your-meals",
    "water",
    "weight",
    "goals-progress",
    "insights-trends",
    "settings-account",
];

export const CATEGORY_META: Record<CategoryId, { icon: string }> = {
    "logging-food-meals": { icon: "fa-solid fa-utensils" },
    "reviewing-your-meals": { icon: "fa-solid fa-clock-rotate-left" },
    water: { icon: "fa-solid fa-glass-water" },
    weight: { icon: "fa-solid fa-weight-scale" },
    "goals-progress": { icon: "fa-solid fa-bullseye" },
    "insights-trends": { icon: "fa-solid fa-chart-area" },
    "settings-account": { icon: "fa-solid fa-gear" },
};

/** One tool card's parameter identity. `name` is a literal MCP API field
 * name and is NEVER translated; its description lives in
 * ToolProse.params, keyed by this same name. */
export interface ToolParamIdentity {
    name: string;
    required: boolean;
}

/** One tool card's structural identity — everything about it that is NOT
 * prose. `name` is the literal MCP tool name (never translated); it
 * doubles as the card's `id=` anchor and as the key into
 * ToolsDoc.tools. */
export interface ToolIdentity {
    name: string;
    category: CategoryId;
    /** Badge chips shown in the card header, in display order. */
    badges: BadgeKind[];
    /** Parameters shown in the card's "Parameters" list, in display
     * order. Empty array = the card shows no Parameters section at all. */
    params: ToolParamIdentity[];
    /** Whether the card's "Try saying" block also shows the "...or send a
     * photo" alternate-input hint (only log_meal and lookup_barcode do). */
    hasPhotoHint: boolean;
}

/**
 * All 48 tools, in the exact document order of public/tools.html (grouped
 * by category — see CategoryId — for the reader). The *set* of names must
 * equal the 48 `server.registerTool()` calls in src/mcp.ts; the two orders
 * differ (mcp.ts registers in its own order, unrelated to this page's
 * reader-facing grouping). "the registered tool set and every hand-typed
 * tool count agree" in src/site-copy.test.ts enforces the set and the
 * count fields of every locale.
 */
export const TOOLS: ToolIdentity[] = [
    {
        name: "log_meal",
        category: "logging-food-meals",
        badges: ["log", "widget"],
        params: [
            { name: "description", required: true },
            { name: "meal_type", required: true },
            { name: "calories", required: false },
            { name: "protein_g", required: false },
            { name: "carbs_g", required: false },
            { name: "fat_g", required: false },
            { name: "saturated_fat_g", required: false },
            { name: "trans_fat_g", required: false },
            { name: "fiber_g", required: false },
            { name: "sugar_g", required: false },
            { name: "added_sugar_g", required: false },
            { name: "alcohol_g", required: false },
            { name: "caffeine_mg", required: false },
            { name: "logged_at", required: false },
            { name: "notes", required: false },
            { name: "items", required: false },
        ],
        hasPhotoHint: true,
    },
    {
        name: "lookup_barcode",
        category: "logging-food-meals",
        badges: ["lookup"],
        params: [],
        hasPhotoHint: true,
    },
    {
        name: "search_foods",
        category: "logging-food-meals",
        badges: ["lookup"],
        params: [{ name: "query", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "get_food_macros",
        category: "logging-food-meals",
        badges: ["lookup"],
        params: [
            { name: "fdc_id", required: true },
            { name: "amount_g", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "start_meal_import",
        category: "logging-food-meals",
        badges: ["import", "widget"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "bulk_import_meals",
        category: "logging-food-meals",
        badges: ["import"],
        params: [
            { name: "meals", required: true },
            { name: "expected_row_count", required: true },
            { name: "expected_total_kcal", required: false },
            { name: "dry_run", required: false },
            { name: "on_error", required: false },
            { name: "source_app", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "update_meal",
        category: "logging-food-meals",
        badges: ["edit", "widget"],
        params: [
            { name: "id", required: true },
            { name: "description", required: false },
            { name: "calories", required: false },
            { name: "protein_g", required: false },
            { name: "carbs_g", required: false },
            { name: "fat_g", required: false },
            { name: "saturated_fat_g", required: false },
            { name: "trans_fat_g", required: false },
            { name: "fiber_g", required: false },
            { name: "sugar_g", required: false },
            { name: "added_sugar_g", required: false },
            { name: "alcohol_g", required: false },
            { name: "caffeine_mg", required: false },
            { name: "logged_at", required: false },
            { name: "notes", required: false },
            { name: "items", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "delete_meal",
        category: "logging-food-meals",
        badges: ["remove"],
        params: [{ name: "id", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "save_meal",
        category: "logging-food-meals",
        badges: ["log"],
        params: [
            { name: "name", required: true },
            { name: "from_meal_id", required: false },
            { name: "description", required: false },
            { name: "meal_type", required: false },
            { name: "items", required: false },
            { name: "calories", required: false },
            { name: "protein_g", required: false },
            { name: "carbs_g", required: false },
            { name: "fat_g", required: false },
            { name: "saturated_fat_g", required: false },
            { name: "trans_fat_g", required: false },
            { name: "fiber_g", required: false },
            { name: "sugar_g", required: false },
            { name: "added_sugar_g", required: false },
            { name: "alcohol_g", required: false },
            { name: "caffeine_mg", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "log_saved_meal",
        category: "logging-food-meals",
        badges: ["log", "widget"],
        params: [
            { name: "saved_meal", required: true },
            { name: "servings", required: false },
            { name: "item_amounts", required: false },
            { name: "leave_out", required: false },
            { name: "meal_type", required: false },
            { name: "description", required: false },
            { name: "logged_at", required: false },
            { name: "notes", required: false },
            { name: "idempotency_key", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "update_saved_meal",
        category: "logging-food-meals",
        badges: ["edit"],
        params: [
            { name: "id", required: true },
            { name: "name", required: false },
            { name: "description", required: false },
            { name: "meal_type", required: false },
            { name: "items", required: false },
            { name: "calories", required: false },
            { name: "protein_g", required: false },
            { name: "carbs_g", required: false },
            { name: "fat_g", required: false },
            { name: "saturated_fat_g", required: false },
            { name: "trans_fat_g", required: false },
            { name: "fiber_g", required: false },
            { name: "sugar_g", required: false },
            { name: "added_sugar_g", required: false },
            { name: "alcohol_g", required: false },
            { name: "caffeine_mg", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "delete_saved_meal",
        category: "logging-food-meals",
        badges: ["remove"],
        params: [{ name: "id", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "search_meals",
        category: "reviewing-your-meals",
        badges: ["view"],
        params: [
            { name: "queries", required: true },
            { name: "days", required: false },
            { name: "limit", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_meals_today",
        category: "reviewing-your-meals",
        badges: ["view"],
        params: [{ name: "detail", required: false }],
        hasPhotoHint: false,
    },
    {
        name: "get_meals_by_date",
        category: "reviewing-your-meals",
        badges: ["view"],
        params: [
            { name: "date", required: true },
            { name: "detail", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_meals_by_date_range",
        category: "reviewing-your-meals",
        badges: ["view"],
        params: [
            { name: "start_date", required: true },
            { name: "end_date", required: true },
            { name: "detail", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_saved_meals",
        category: "reviewing-your-meals",
        badges: ["view"],
        params: [{ name: "name_contains", required: false }],
        hasPhotoHint: false,
    },
    {
        name: "export_all_data",
        category: "reviewing-your-meals",
        badges: ["export"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "log_water",
        category: "water",
        badges: ["log"],
        params: [{ name: "amount_ml", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "get_water_today",
        category: "water",
        badges: ["view"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "get_water_by_date",
        category: "water",
        badges: ["view"],
        params: [{ name: "date", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "delete_water",
        category: "water",
        badges: ["remove"],
        params: [{ name: "id", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "log_weight",
        category: "weight",
        badges: ["log"],
        params: [{ name: "weight", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "update_weight",
        category: "weight",
        badges: ["edit"],
        params: [
            { name: "id", required: true },
            { name: "weight", required: false },
            { name: "logged_at", required: false },
            { name: "notes", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "delete_weight",
        category: "weight",
        badges: ["remove"],
        params: [{ name: "id", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "get_weight_today",
        category: "weight",
        badges: ["view"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "get_weight_by_date",
        category: "weight",
        badges: ["view"],
        params: [{ name: "date", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "get_weight_by_date_range",
        category: "weight",
        badges: ["view"],
        params: [
            { name: "start_date", required: true },
            { name: "end_date", required: true },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_weight_trends",
        category: "weight",
        badges: ["view", "widget"],
        params: [{ name: "days", required: false }],
        hasPhotoHint: false,
    },
    {
        name: "set_weight_unit",
        category: "weight",
        badges: ["setting"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "log_body_measurement",
        category: "weight",
        badges: ["log"],
        params: [
            { name: "kind", required: true },
            { name: "value", required: true },
            { name: "unit", required: false },
            { name: "logged_at", required: false },
            { name: "notes", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_body_measurements",
        category: "weight",
        badges: ["view"],
        params: [
            { name: "kind", required: false },
            { name: "start_date", required: false },
            { name: "end_date", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "update_body_measurement",
        category: "weight",
        badges: ["edit"],
        params: [
            { name: "id", required: true },
            { name: "value", required: false },
            { name: "unit", required: false },
            { name: "logged_at", required: false },
            { name: "notes", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "delete_body_measurement",
        category: "weight",
        badges: ["remove"],
        params: [{ name: "id", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "set_length_unit",
        category: "weight",
        badges: ["setting"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "set_nutrition_goals",
        category: "goals-progress",
        badges: ["setting"],
        params: [
            { name: "daily_calories", required: false },
            { name: "daily_protein_g", required: false },
            { name: "daily_carbs_g", required: false },
            { name: "daily_fat_g", required: false },
            { name: "daily_saturated_fat_g", required: false },
            { name: "daily_fiber_g", required: false },
            { name: "daily_sugar_g", required: false },
            { name: "daily_added_sugar_g", required: false },
            { name: "daily_alcohol_g", required: false },
            { name: "daily_caffeine_mg", required: false },
            { name: "daily_water_ml", required: false },
            { name: "target_weight", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_nutrition_goals",
        category: "goals-progress",
        badges: ["view"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "get_goal_progress",
        category: "goals-progress",
        badges: ["view", "widget"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "get_nutrition_summary",
        category: "goals-progress",
        badges: ["view", "widget"],
        params: [
            { name: "start_date", required: true },
            { name: "end_date", required: true },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_trends",
        category: "insights-trends",
        badges: ["view", "widget"],
        params: [
            { name: "days", required: false },
            { name: "group_by", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "get_meal_patterns",
        category: "insights-trends",
        badges: ["view"],
        params: [{ name: "days", required: false }],
        hasPhotoHint: false,
    },
    {
        name: "get_profile",
        category: "settings-account",
        badges: ["view"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "set_timezone",
        category: "settings-account",
        badges: ["setting"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "set_language",
        category: "settings-account",
        badges: ["setting"],
        params: [{ name: "locale", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "get_current_time",
        category: "settings-account",
        badges: ["view"],
        params: [],
        hasPhotoHint: false,
    },
    {
        name: "set_widget_display",
        category: "settings-account",
        badges: ["setting"],
        params: [{ name: "enabled", required: true }],
        hasPhotoHint: false,
    },
    {
        name: "set_alcohol_tracking",
        category: "settings-account",
        badges: ["setting"],
        params: [
            { name: "enabled", required: true },
            { name: "drink_unit", required: false },
        ],
        hasPhotoHint: false,
    },
    {
        name: "delete_account",
        category: "settings-account",
        badges: ["remove"],
        params: [],
        hasPhotoHint: false,
    },
];

/** Troubleshooting entries on /tools, in display order. Each id is the
 * <details> DOM id (deep-linkable as /tools#<id>), never translated;
 * kebab-case so it can't collide with a tool id or CategoryId. */
export const TROUBLESHOOTING_IDS = [
    "cannot-connect",
    "session-expired",
    "cannot-sign-in",
    "history-missing",
    "tools-not-used",
    "wrong-day",
    "no-widgets",
    "import-problems",
    "rate-limited",
    "barcode-not-found",
    "usda-unavailable",
    "health-sync-yesterday",
    "health-sync-higher",
    "health-sync-stopped",
    "export-link",
    "delete-account",
    "report-a-problem",
] as const;
export type TroubleshootingId = (typeof TROUBLESHOOTING_IDS)[number];

// ----------------------------------------------------------------- prose

/** One category's translatable copy — the jump-bar pill's short label,
 * and the section head's longer title + one-line description. */
export interface CategoryProse {
    pillLabel: string;
    title: string;
    description: string;
}

/**
 * A tool's translatable prose. `params` is keyed by ToolParamIdentity.name
 * — only for params this tool actually has (see ToolIdentity.params) —
 * and every value is a trusted HTML string (see this file's header for
 * why every param description shares that trust level, even the markup-
 * free majority). An empty string means the parameter row shows only its
 * name and required/optional badge, with no trailing description — true
 * of several params on update_meal, update_weight, and
 * set_nutrition_goals in the English source (the field is self-
 * explanatory, or already described by a sibling like `calories` in
 * log_meal).
 */
export interface ToolProse {
    /** Plain text, escaped by the generator. */
    description: string;
    /** Keyed by ToolParamIdentity.name. Trusted HTML — see file header. */
    params: Record<string, string>;
    /** The "Try saying" example phrase. Plain text, escaped by the
     * generator. */
    example: string;
    /** The "...or send a photo" alternate-input hint. Plain text, escaped
     * by the generator. Present only when ToolIdentity.hasPhotoHint is
     * true for this tool. */
    photoHint?: string;
}

/** One entry of the /tools Troubleshooting section — see
 * TROUBLESHOOTING_IDS for the ids and their order. */
export interface TroubleshootingEntry {
    /** <summary>, plain text (escaped). */
    question: string;
    /** Trusted HTML. Links only to #anchors, https:// or mailto: — never a
     * site-relative "/…" path (plain data has no pathFor(), so a translated
     * page would link back to English). */
    answerHtml: string;
}

export interface ToolsDoc {
    /** `<head>` metadata. `title` is the bare page title — the generator
     * appends " — Nutrition MCP", the same convention LegalDoc.title
     * follows — and reuses it for `og:title` too, since the English
     * source's `<title>` and `og:title` are identical text. */
    meta: {
        title: string;
        description: string;
        ogDescription: string;
    };
    hero: {
        /** The pill above the h1 reads "{eyebrow} · {countBold}
         * {countTail}" — the " · " separator is the generator's. */
        eyebrow: string;
        /** The h1, split around its accent word the same way
         * IndexDoc.hero is ("Everything your AI can " + <em>"do"</em> +
         * ""), so all three stay plain text (escaped) and each locale picks
         * its own accented word. Either outer part may be "". */
        titleBeforeEm: string;
        titleEm: string;
        titleAfterEm: string;
        lead: string;
        /** The bold "N tools" lead-in of the hero's count pill. */
        countBold: string;
        /** The count pill's trailing text, e.g. "across 7 areas". */
        countTail: string;
    };
    categories: Record<CategoryId, CategoryProse>;
    /** One translatable label per BadgeKind, shown on every card that
     * carries that badge — keyed once here, not per tool (see
     * BadgeKind's doc comment). */
    badges: Record<BadgeKind, string>;
    /** Structural UI chrome repeated on every tool card — was hardcoded
     * English in scripts/gen-tools.ts until a translation review caught it
     * (every tool's prose was translated, but these labels weren't). */
    ui: {
        /** The "Parameters" section label. */
        parametersLabel: string;
        /** ToolParamIdentity.required's badge text. */
        requiredLabel: string;
        /** ToolParamIdentity.required === false's badge text. */
        optionalLabel: string;
        /** The label above each card's example prompt. */
        trySayingLabel: string;
        /** aria-label of the sticky category-chip <nav>. */
        categoriesLabel: string;
    };
    /** Keyed by ToolIdentity.name. */
    tools: Record<string, ToolProse>;
    /** The Troubleshooting section at the bottom of the page, with its own
     * jump-bar pill. `pillLabel`, `title` and `description` are plain text
     * (escaped); each entry's `answerHtml` is trusted HTML. A `Record` so a
     * locale missing an entry fails typecheck. The copy restates several
     * constants from the code (rate limits, ban length, sign-in session and
     * export-link lifetimes, refresh-token lifetime) — src/site-copy.test.ts
     * pins them. */
    troubleshooting: {
        pillLabel: string;
        title: string;
        description: string;
        /** Plain text (escaped) in the section's intro column; the
         * generator follows it with the contact mailto link. */
        stillStuck: string;
        items: Record<TroubleshootingId, TroubleshootingEntry>;
    };
}

// ---------------------------------------------------------------- English

const TOOLS_EN: ToolsDoc = {
    meta: {
        title: "48 Calorie, Macro, Water & Weight Tools",
        description:
            "All 48 Nutrition MCP tools for Claude, ChatGPT and more: log meals, save meals you eat often, scan barcodes, import a MyFitnessPal or Cronometer CSV, track water, weight and body measurements.",
        ogDescription:
            "All 48 tools the Nutrition MCP server gives your AI, from saved meals to a CSV importer for your history — with descriptions and example prompts.",
    },
    hero: {
        eyebrow: "Reference",
        titleBeforeEm: "Everything your AI can ",
        titleEm: "do",
        titleAfterEm: "",
        lead: "You never call these directly — you just talk to Claude, ChatGPT or another MCP client, and it picks the right tool. Here's every tool the Nutrition MCP server exposes for meals and saved meals, calories and macros, water and weight, with what each one does and a phrase that triggers it.",
        countBold: "48 tools",
        countTail: "across 7 areas",
    },
    categories: {
        "logging-food-meals": {
            pillLabel: "Logging",
            title: "Logging food & meals",
            description:
                "The core loop — capture what you ate, however you describe it, and save the meals you eat often to log again in one line.",
        },
        "reviewing-your-meals": {
            pillLabel: "Reviewing",
            title: "Reviewing your meals",
            description:
                "Look back over what you've logged, one day or a whole range at a time.",
        },
        water: {
            pillLabel: "Water",
            title: "Water tracking",
            description: "Track hydration alongside your food.",
        },
        weight: {
            pillLabel: "Body",
            title: "Weight & body measurements",
            description:
                "Log weigh-ins and tape measurements, review them, and watch your weight trend toward your target.",
        },
        "goals-progress": {
            pillLabel: "Goals",
            title: "Goals & progress",
            description: "Set targets and see how each day measures up.",
        },
        "insights-trends": {
            pillLabel: "Insights",
            title: "Insights & trends",
            description:
                "Pre-aggregated analysis so the AI can spot patterns without doing arithmetic.",
        },
        "settings-account": {
            pillLabel: "Settings",
            title: "Settings & account",
            description:
                "Preferences that keep everything accurate, plus full control of your data.",
        },
    },
    badges: {
        log: "Log",
        widget: "Interactive UI",
        lookup: "Look up",
        import: "Import",
        edit: "Edit",
        remove: "Remove",
        view: "View",
        export: "Export",
        setting: "Setting",
    },
    ui: {
        parametersLabel: "Parameters",
        requiredLabel: "required",
        optionalLabel: "optional",
        trySayingLabel: "Try saying",
        categoriesLabel: "Tool categories",
    },
    tools: {
        log_meal: {
            description:
                "Log what you ate with calories and macros — plus saturated and trans fat, fiber, total and added sugar, alcohol and caffeine when the numbers are there. Describe it in plain language — the AI estimates the numbers, asks about portion size when it's unclear, and can pull label data from a barcode or the web first. It can also take the ingredients one by one, and then the totals are the sum of those ingredients.",
            params: {
                description: "What was eaten",
                meal_type: "breakfast, lunch, dinner or snack",
                calories: "Total calories",
                protein_g: "Protein in grams",
                carbs_g: "Carbohydrates in grams",
                fat_g: "Fat in grams",
                saturated_fat_g:
                    "Optional. Saturated fat in grams, part of fat_g and never more than it. A blank is stored as not measured and leaves that day out of your saturated-fat average and limit; 0 is the right value for a food with none.",
                trans_fat_g:
                    "Optional. <b>Trans</b> fat in grams, a separate fat type that is not checked against fat_g. It has no limit and is shown only where it was recorded; 0 is the right value for a food with none.",
                fiber_g:
                    "Dietary fiber in grams. The AI is told to fill this in on every meal, estimating from the ingredients when no label figure exists, because a blank is not a zero — it leaves the whole day out of your fiber average",
                sugar_g:
                    '<b>Total</b> sugars in grams — the figure a label prints under "Sugars", including the sugar naturally in fruit and milk, not just added sugar. Filled in on every meal on the same terms as fiber',
                added_sugar_g:
                    "<b>Added</b> sugars in grams — sugar added during processing or preparation (table sugar, syrups, honey, the sugar in sweetened drinks and foods). Part of total sugars, never more than it. Sugar naturally in whole fruit, vegetables and plain milk is not added, and neither is 100% fruit juice. Filled in on every meal on the same terms as fiber: whole foods are 0, a soft drink's sugar is all added, and a US label's \"Includes Xg Added Sugars\" line is used when there is one. It accompanies <code>sugar_g</code>: a meal given total sugars without added sugars may not be saved",
                alcohol_g:
                    "Grams of <b>pure ethanol</b>, not the volume of the drink and not its ABV — the AI works it out from the pour size and strength (a 330 ml 5% beer is 13 g)",
                caffeine_mg:
                    "Caffeine in <b>milligrams</b>, not grams — the one field here that isn't in grams, because that is how every label and guideline states it (a brewed coffee is about 95 mg, an espresso 63 mg, a can of cola 34 mg). Caffeine adds no calories. Unlike fiber and sugar it is only sent for things that actually contain caffeine — a recorded 0 would put a caffeine row on your dashboard for a nutrient you never consume",
                logged_at:
                    "When you ate it, if not now — lets you log something after the fact",
                notes: "Additional notes",
                items: "Ingredients, one row each, with their amounts and nutrients: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code> and <code>fat_g</code> on every item; <code>fiber_g</code>, <code>sugar_g</code> and <code>added_sugar_g</code> on every item or on none; <code>alcohol_g</code> and <code>caffeine_mg</code> only on the items that contain them, summed over those items. The meal's totals are then the sum of the items, so send items or totals, not both",
            },
            example: "Log a chicken burrito bowl with extra guac for lunch",
            photoHint:
                "…or just snap a photo of your plate — the AI names each dish, sizes portions in everyday measures (a glass, a handful), checks how you've logged it before, and confirms with you before logging.",
        },
        lookup_barcode: {
            description:
                "Fetch a packaged product's label nutrition from Open Food Facts by its barcode (8–14 digit EAN/UPC), plus its Nutri-Score and NOVA processing group when Open Food Facts has them. Added sugar is shown when Open Food Facts lists it, and marked when Open Food Facts estimated it from the ingredients. You can type the digits or read them off a photo of the package; the result can then be logged, scaled to how much you ate.",
            params: {},
            example: "Scan this barcode: 3017620422003",
            photoHint:
                "…or send a photo of the package — the AI reads the barcode digits off it.",
        },
        search_foods: {
            description:
                "Searches USDA FoodData Central generic foods (Foundation, SR Legacy and Survey/FNDDS records) by English food name and returns up to 10 candidates, each with its FoodData Central id, USDA description, data type and energy and macros per 100 g. Matches use USDA's English wording (e.g. 'cooked, boiled').",
            params: {
                query: "The food name in English, up to 200 characters, e.g. banana or lentils, cooked",
            },
            example: "What does USDA list for a raw banana?",
        },
        get_food_macros: {
            description:
                "Returns USDA FoodData Central values for one generic food by its FoodData Central id: per 100 g, and scaled to amount_g when given, with the portion sizes USDA lists. A nutrient USDA does not record for the food is reported as not recorded, never as zero. Includes the food_ref the meal tools accept for these values.",
            params: {
                fdc_id: "The FoodData Central id of the food, as listed by search_foods",
                amount_g:
                    "Optional amount in grams, above 0 and up to 5,000, to scale the values to",
            },
            example: "What are the USDA macros for 150 g of that banana?",
        },
        start_meal_import: {
            description:
                "Open an importer in the chat to bring your history over from another app — pick the CSV you exported from MyFitnessPal, Cronometer, Lose It!, MacroFactor or another tracker, match its columns to calories, macros, fiber, total and added sugar and caffeine — plus alcohol if you've turned alcohol tracking on — and review what will be added before you confirm. The file is read in your browser, nothing is saved until you approve the preview, and importing the same file again won't create duplicates.",
            params: {},
            example: "Import my meal history from MyFitnessPal",
        },
        bulk_import_meals: {
            description:
                "Add a batch of past meals in one go — up to 50 at a time — instead of logging them one by one. The importer above writes through this, and the AI can use it directly for meal data you've pasted into the chat. Every row is checked first and anything that doesn't fit is reported row by row, so re-sending the same rows is safe and won't duplicate what's already logged, as long as your timezone hasn't changed in between.",
            params: {
                meals: "The rows to import, in source-file order (1–50 per call). Each row can carry a time, meal type, description, notes and the same numbers as a logged meal: <code>calories</code>, <code>protein_g</code>, <code>carbs_g</code>, <code>fat_g</code>, <code>saturated_fat_g</code>, <code>trans_fat_g</code>, <code>fiber_g</code>, <code>sugar_g</code> (total sugars), <code>added_sugar_g</code> (added sugars, part of the total), <code>alcohol_g</code> (grams of pure ethanol) and <code>caffeine_mg</code> (milligrams, not grams)",
                expected_row_count:
                    "How many rows this call carries, counted from the source file, so a dropped row gets caught",
                expected_total_kcal:
                    "Calorie total from the source file, reconciled against what arrives",
                dry_run: "Report what would happen without writing anything",
                on_error:
                    "Import the valid rows and report the rest, or write nothing if any row fails",
                source_app: "Which app the file came from",
            },
            example:
                "Here's last week's meals pasted from my old app — add them all",
        },
        update_meal: {
            description:
                "Change the details of a meal you already logged — its description, any macro, fiber, total or added sugar, alcohol or caffeine, the time, or notes. Also how a gap gets backfilled: if a meal went in without its fiber, sugar or added sugar, the server says so and the AI fills it in here once you agree. On a meal logged with ingredients, the totals change through its ingredient list.",
            params: {
                id: "UUID of the meal to update",
                description: "",
                calories: "",
                protein_g: "",
                carbs_g: "",
                fat_g: "",
                saturated_fat_g:
                    "Optional. Saturated fat in grams, part of fat_g and never more than it. A blank is stored as not measured and leaves that day out of your saturated-fat average and limit; 0 is the right value for a food with none.",
                trans_fat_g:
                    "Optional. <b>Trans</b> fat in grams, a separate fat type that is not checked against fat_g. It has no limit and is shown only where it was recorded; 0 is the right value for a food with none.",
                fiber_g: "",
                sugar_g: "Total sugars, not added sugar",
                added_sugar_g:
                    "Added sugars only, never more than total sugars. It accompanies <code>sugar_g</code>: a change to total sugars on a meal with no added sugars recorded may not be saved without it",
                alcohol_g: "Grams of pure ethanol, not the volume of the drink",
                caffeine_mg: "Milligrams, not grams",
                logged_at: "",
                notes: "",
                items: "The full ingredient list, replacing the existing one. The meal's totals become the sum of this list, so the totals fields can't be sent with it",
            },
            example: "Actually that lunch was 600 calories, not 500 — fix it",
        },
        delete_meal: {
            description: "Remove a meal entry you logged by mistake.",
            params: {
                id: "UUID of the meal to delete",
            },
            example: "Delete the snack I logged this afternoon",
        },
        save_meal: {
            description:
                "Save a meal you eat often under a name, such as your usual breakfast, with its values for one serving and, if you have them, its ingredients. Give the values yourself or copy them from a meal you already logged. Saving adds nothing to your diary; log the saved meal with log_saved_meal when you eat it.",
            params: {
                name: "The name to save it under, unique among your saved meals (1–100 characters)",
                from_meal_id:
                    "UUID of a logged meal to copy its values and ingredients from",
                description: "What the saved meal is. Defaults to its name",
                meal_type:
                    "breakfast, lunch, dinner or snack — the default when you log it",
                items: "Ingredients, one row each, with their amounts and nutrients. Their sum becomes the saved meal's values, so send items or values, not both",
                calories: "Total calories for one serving",
                protein_g: "Protein in grams for one serving",
                carbs_g: "Carbohydrates in grams for one serving",
                fat_g: "Fat in grams for one serving",
                saturated_fat_g:
                    "Optional. Saturated fat in grams, part of fat_g and never more than it. A blank is stored as not measured and leaves that day out of your saturated-fat average and limit; 0 is the right value for a food with none.",
                trans_fat_g:
                    "Optional. <b>Trans</b> fat in grams, a separate fat type that is not checked against fat_g. It has no limit and is shown only where it was recorded; 0 is the right value for a food with none.",
                fiber_g: "Dietary fiber in grams for one serving",
                sugar_g: "Total sugars in grams for one serving",
                added_sugar_g:
                    "Added sugars in grams for one serving, never more than total sugars. It accompanies <code>sugar_g</code>",
                alcohol_g:
                    "Grams of pure ethanol for one serving, not the volume of the drink",
                caffeine_mg:
                    "Milligrams of caffeine for one serving, not grams",
            },
            example: "Save this as my usual breakfast",
        },
        log_saved_meal: {
            description:
                "Log a saved meal as a meal entry from now or from a time you give. The entry gets a copy of the saved values and ingredients, scaled by servings, with single ingredients optionally set to the amount actually eaten or left out for this one time. Later changes to the saved meal leave meals already logged from it as they are.",
            params: {
                saved_meal:
                    "The saved meal's name, or its ID from get_saved_meals or search_meals",
                servings:
                    "How many servings to log: more than 0 and up to 20 (default 1)",
                item_amounts:
                    "The amounts of single ingredients actually eaten in this entry, by name or position. Servings scales the saved meal first, then these set the named ingredients' amounts, and their nutrients scale in proportion",
                leave_out:
                    "Ingredients to drop from this entry, by name or position",
                meal_type:
                    "breakfast, lunch, dinner or snack — overrides the saved meal's default",
                description:
                    "Description for this entry. Defaults to the saved meal's description",
                logged_at: "When you ate it, if not now",
                notes: "Additional notes",
                idempotency_key:
                    "A key that makes a retried call a no-op, so the same entry is not logged twice",
            },
            example: "Log my usual breakfast, half a serving",
        },
        update_saved_meal: {
            description:
                "Change a saved meal's name, description, default meal type, ingredients or values per serving. Meals already logged from it keep their values.",
            params: {
                id: "UUID of the saved meal to update",
                name: "New name, unique among your saved meals",
                description: "New description",
                meal_type:
                    "New default meal type: breakfast, lunch, dinner or snack",
                items: "The full ingredient list, replacing the existing one. Its sum becomes the saved meal's values, so the values fields can't be sent with it",
                calories: "Total calories for one serving",
                protein_g: "Protein in grams for one serving",
                carbs_g: "Carbohydrates in grams for one serving",
                fat_g: "Fat in grams for one serving",
                saturated_fat_g:
                    "Optional. Saturated fat in grams, part of fat_g and never more than it. A blank is stored as not measured and leaves that day out of your saturated-fat average and limit; 0 is the right value for a food with none.",
                trans_fat_g:
                    "Optional. <b>Trans</b> fat in grams, a separate fat type that is not checked against fat_g. It has no limit and is shown only where it was recorded; 0 is the right value for a food with none.",
                fiber_g: "Dietary fiber in grams for one serving",
                sugar_g: "Total sugars in grams for one serving",
                added_sugar_g:
                    "Added sugars in grams for one serving, never more than total sugars. It accompanies <code>sugar_g</code>",
                alcohol_g:
                    "Grams of pure ethanol for one serving, not the volume of the drink",
                caffeine_mg:
                    "Milligrams of caffeine for one serving, not grams",
            },
            example:
                "My usual breakfast now has 350 calories per serving — update it",
        },
        delete_saved_meal: {
            description:
                "Delete a saved meal. Meals already logged from it keep their values.",
            params: {
                id: "UUID of the saved meal to delete",
            },
            example: "Delete the saved meal called old lunch",
        },
        search_meals: {
            description:
                "Search your past meals by keyword and see them grouped into your recurring variations — how often each was logged, when last, and its typical calories. This is how the AI checks a photo of your plate against how you've actually logged that meal before, and how \"log my usual breakfast\" works. It also matches the names of a meal's ingredients, and lists your saved meals whose name, description or ingredients match.",
            params: {
                queries:
                    "Food keyword alternatives, in any language you've logged in",
                days: "How far back to look (default a year)",
                limit: "Max entries to analyze",
            },
            example: "Log my usual breakfast",
        },
        get_meals_today: {
            description: "See every meal you've logged today.",
            params: {
                detail: "<code>compact</code> (default) for one line per meal with its id, or <code>full</code> to include notes and exact times",
            },
            example: "What have I eaten today?",
        },
        get_meals_by_date: {
            description: "See all the meals you logged on a specific day.",
            params: {
                date: "Date in YYYY-MM-DD format",
                detail: "<code>compact</code> (default) for one line per meal with its id, or <code>full</code> to include notes and exact times",
            },
            example: "Show me everything I ate on July 4th",
        },
        get_meals_by_date_range: {
            description:
                "Pull all meals between two dates in one go — handy for reviewing a week or a month. One call covers up to 31 days; for longer stretches, trends and summaries give you daily totals.",
            params: {
                start_date: "Start date (YYYY-MM-DD)",
                end_date:
                    "End date (YYYY-MM-DD), up to 31 days including the start",
                detail: "<code>compact</code> (default) for one line per meal with its id, or <code>full</code> to include notes and exact times",
            },
            example: "List my meals from Monday to Friday",
        },
        get_saved_meals: {
            description:
                "See your saved meals with their values per serving and their ingredients, optionally only those whose name includes some text.",
            params: {
                name_contains: "Only saved meals whose name includes this text",
            },
            example: "What meals have I saved?",
        },
        export_all_data: {
            description:
                "Export everything the service stores about you as a single ZIP — meals.csv, meal_items.csv (the ingredients of each logged meal), saved_meals.csv and saved_meal_items.csv (your saved meals and their ingredients), water.csv, weight.csv, body_measurements.csv, goals.csv, goals_history.csv (every change to your goals, dated), profile.csv, account.csv (your sign-in account), telemetry.csv (tool-usage records), connections.csv (your connected AI apps and Apple Health sync, without any tokens), health_sync.csv (what Apple Health sync sent over the last 8 days), and a README.txt explaining the columns, the units and what is not included — and hands back a private download link, valid for 60 minutes. Meals are the only part that can be imported back in for now.",
            params: {},
            example: "Export all of my data — meals, water, weight, and goals",
        },
        log_water: {
            description:
                "Log a hydration entry. Give it in any unit — cups, ounces, liters — and it's converted to millilitres for you.",
            params: {
                amount_ml: "Amount in milliliters (integer, &gt; 0).",
            },
            example: "I just drank a 500 ml bottle of water",
        },
        get_water_today: {
            description: "See today's total water intake and each entry.",
            params: {},
            example: "How much water have I had today?",
        },
        get_water_by_date: {
            description: "See your water total and entries for a specific day.",
            params: {
                date: "Date in YYYY-MM-DD format",
            },
            example: "How much did I drink yesterday?",
        },
        delete_water: {
            description: "Remove a water entry you added by mistake.",
            params: {
                id: "UUID of the water entry to delete",
            },
            example: "Remove that last water entry",
        },
        log_weight: {
            description:
                "Record a body-weight measurement in kg or lb. Multiple weigh-ins per day are fine, and the server stores it canonically so your unit preference never distorts the number.",
            params: {
                weight: "Body weight value, in <code>unit</code> (&gt; 0).",
            },
            example: "Log my weight — 74.2 kg this morning",
        },
        update_weight: {
            description:
                "Correct an existing weigh-in — the value, the timestamp, or its notes.",
            params: {
                id: "UUID of the weight entry to update",
                weight: "New weight value, in <code>unit</code>.",
                logged_at: "ISO 8601 timestamp",
                notes: "",
            },
            example: "Fix this morning's weigh-in to 73.8 kg",
        },
        delete_weight: {
            description: "Remove a weight entry.",
            params: {
                id: "UUID of the weight entry to delete",
            },
            example: "Delete today's weight entry",
        },
        get_weight_today: {
            description: "See today's weigh-ins, shown in your preferred unit.",
            params: {},
            example: "What did I weigh today?",
        },
        get_weight_by_date: {
            description: "See your weigh-ins for a specific day.",
            params: {
                date: "Date in YYYY-MM-DD format",
            },
            example: "What was my weight on the 1st?",
        },
        get_weight_by_date_range: {
            description:
                "Get every weigh-in between two dates, grouped by day with each day's average.",
            params: {
                start_date: "Start date (YYYY-MM-DD)",
                end_date: "End date (YYYY-MM-DD)",
            },
            example: "Show my weigh-ins for the last two weeks",
        },
        get_weight_trends: {
            description:
                "See your weight trend over a window: a smoothed trend weight that evens out day-to-day swings, your weekly rate of change, latest reading, overall change, min/max, and progress toward your target weight. The chart also zooms out to 90 days, a year or your whole history.",
            params: {
                days: "Window size in days (default 30, max 365).",
            },
            example: "How's my weight trending this month?",
        },
        set_weight_unit: {
            description:
                "Choose whether weights show and are entered in kg or lb. Stored values are unaffected — only display and default parsing change.",
            params: {},
            example: "Use pounds for my weight from now on",
        },
        log_body_measurement: {
            description:
                "Record a tape measurement of one body site — waist, hips, neck, chest, shoulders, upper arm, forearm, thigh or calf — in cm or inches. Stored exactly as entered alongside a canonical value, so switching units never shifts a number. Numbers far outside a realistic range for the site are refused as likely typos.",
            params: {
                kind: "Which site: <code>waist</code>, <code>hips</code>, <code>neck</code>, <code>chest</code>, <code>shoulders</code>, <code>upper_arm</code>, <code>forearm</code>, <code>thigh</code> or <code>calf</code>. One value per site; a side (left/right) can go in notes.",
                value: "The measurement, in <code>unit</code> (&gt; 0).",
                unit: "<code>cm</code> or <code>in</code>; defaults to your saved length unit.",
                logged_at: "When it was measured, if not now",
                notes: "Additional notes",
            },
            example: "Log my waist — 82 cm this morning",
        },
        get_body_measurements: {
            description:
                "List your body measurements by day, oldest first, optionally for one site only. Covers the last 30 days unless you give dates, up to 366 days per call.",
            params: {
                kind: "Only this site (e.g. <code>waist</code>)",
                start_date: "Start date (YYYY-MM-DD)",
                end_date:
                    "End date (YYYY-MM-DD), up to 366 days including the start",
            },
            example: "Show my waist measurements from the last three months",
        },
        update_body_measurement: {
            description:
                "Correct an existing measurement — the value, its unit, the time, or notes. The site itself is fixed; a different site is a new entry.",
            params: {
                id: "UUID of the measurement to update",
                value: "New value, in <code>unit</code>.",
                unit: "Defaults to the unit the entry was recorded in.",
                logged_at: "ISO 8601 timestamp",
                notes: "Replacement notes",
            },
            example: "That hip measurement was 98 cm, not 89",
        },
        delete_body_measurement: {
            description: "Remove a body measurement entry.",
            params: {
                id: "UUID of the measurement to delete",
            },
            example: "Delete today's neck measurement",
        },
        set_length_unit: {
            description:
                "Choose whether body measurements are shown and entered in centimetres or inches. Separate from your weight unit. Stored values are unaffected — only display and default parsing change.",
            params: {},
            example: "Use inches for my measurements",
        },
        set_nutrition_goals: {
            description:
                "Set your daily calorie, macro, saturated fat, fiber, sugar, added sugar, alcohol, caffeine and water goals, plus an optional target body weight. Calories, protein, carbs, fat, fiber and water are targets to reach; saturated fat, total sugar, added sugar, alcohol and caffeine are limits to stay under, and progress is worded accordingly. Update only the fields you name; the rest stay put.",
            params: {
                daily_calories: "Daily calorie target (kcal). Null to clear.",
                daily_protein_g: "Daily protein target (grams). Null to clear.",
                daily_carbs_g: "Daily carbs target (grams). Null to clear.",
                daily_fat_g: "Daily fat target (grams). Null to clear.",
                daily_saturated_fat_g:
                    "Daily saturated fat limit (grams). Null to clear.",
                daily_fiber_g:
                    "Daily fiber target (grams), a minimum to reach. Null to clear.",
                daily_sugar_g:
                    "Daily limit for <b>total</b> sugars (grams), a maximum to stay under. Total sugars include the sugar naturally in fruit and milk, so public added-sugar guidance is a much lower number. Null to clear.",
                daily_added_sugar_g:
                    "Daily limit for <b>added</b> sugars (grams), a maximum to stay under. Counts only added sugars, not the sugar naturally in fruit and milk; public guidance figures for sugar usually refer to this measure (the American Heart Association suggests at most 25 g a day for women and 36 g for men). 0 is a real limit meaning none at all. Null to clear.",
                daily_alcohol_g:
                    "Daily alcohol limit in grams of <b>pure ethanol</b>, a maximum to stay under. One US standard drink is 14 g, one UK unit 7.9 g. Null to clear.",
                daily_caffeine_mg:
                    "Daily caffeine limit in <b>milligrams</b>, a maximum to stay under. EFSA and the FDA put the ceiling for healthy adults at 400 mg a day (roughly four brewed coffees); EFSA's figure for pregnancy is 200 mg. 0 is a real limit meaning none at all. Null to clear.",
                daily_water_ml: "",
                target_weight: "",
            },
            example:
                "Set my goals to 2,200 calories, 160 g protein, and a 75 kg target weight",
        },
        get_nutrition_goals: {
            description:
                "See your current daily calorie and macro targets, any fiber target and sugar or caffeine limit, and — if you track alcohol — your alcohol limit.",
            params: {},
            example: "What are my daily targets?",
        },
        get_goal_progress: {
            description:
                "See how today's intake stacks up against your goals — intake-vs-goal rings plus body-weight progress. Tap a macro ring to see which meals contributed.",
            params: {},
            example: "How am I doing against my goals today?",
        },
        get_nutrition_summary: {
            description:
                "Get daily nutrition totals across a date range as an interactive dashboard: macro tiles vs. goals and a per-day breakdown. One call covers up to 92 days; for longer stretches, trends give you rolling averages.",
            params: {
                start_date: "Start date (YYYY-MM-DD)",
                end_date:
                    "End date (YYYY-MM-DD), up to 92 days including the start",
            },
            example: "Give me a summary of this past week",
        },
        get_trends: {
            description:
                "Rolling 7/14/30-day averages, variability, logging streaks, day-of-week calorie averages, and your best and worst days by calories — pre-computed so the AI can just narrate them. With group_by, it also gives averages by week, month, quarter or year — per logged day, so days with no meals are left out — set against the targets in effect at the time, with how many days were on target and how many look incomplete.",
            params: {
                days: "Window size in days (default 30, max 365).",
                group_by:
                    "<code>week</code>, <code>month</code>, <code>quarter</code> or <code>year</code>: 26 weeks, 24 months, 12 quarters or 5 years, ending with the period that contains the end date (today by default). The span is fixed; <code>days</code> still sets the rolling averages.",
            },
            example: "How did my months go against my targets?",
        },
        get_meal_patterns: {
            description:
                "Surface behavioural patterns: how often you eat each meal type, the breakfast effect, high-calorie lunches, late dinners, weekday vs weekend, and outlier days.",
            params: {
                days: "Window size in days (default 30, min 7, max 365).",
            },
            example:
                "Any patterns in how I eat — like late dinners or skipping breakfast?",
        },
        get_profile: {
            description:
                "See your current settings in one go: timezone (plus local date and time), widget language, preferred weight and length units, whether in-chat widgets are shown, and whether alcohol tracking is on.",
            params: {},
            example: "What are my current settings?",
        },
        set_timezone: {
            description:
                "Set your IANA timezone so days roll over at your local midnight — a meal logged at 11pm counts on that day, not the next UTC one.",
            params: {},
            example: "I'm in Berlin — set my timezone",
        },
        set_language: {
            description:
                "Set the UI language for in-chat widgets — the dashboards and charts, not what the AI writes back to you.",
            params: {
                locale: "ISO 639-1 code, e.g. <code>de</code>, <code>ja</code>. Supported: English, German, Spanish, French, Dutch, Polish, Italian, Ukrainian, Japanese, Turkish.",
            },
            example: "Show my widgets in German",
        },
        get_current_time: {
            description:
                'Check the date and time right now in your timezone, plus the UTC instant. Some apps don\'t tell the assistant what time it is, so this is how it works out what "this morning" or "today" means without asking you (defaults to UTC if no timezone is set).',
            params: {},
            example: "What time is it for me right now?",
        },
        set_widget_display: {
            description:
                "Turn the in-chat visual widgets on or off — the dashboards, goal rings, and trend charts. When off, the same tools reply with text and data only. Enabled by default; the change applies to new conversations.",
            params: {
                enabled: "true to show widgets, false for text-only responses",
            },
            example: "Turn off the widgets",
        },
        set_alcohol_tracking: {
            description:
                "Turn alcohol tracking on or off, and choose whether drinks are counted in US standard drinks or UK units. It's off by default, so you have to ask for it. Turning it off again hides alcohol from meals, goals and progress and stops the file importer reading a file's alcohol column — nothing already logged is deleted, your CSV export still includes it, and it reappears if you switch it back on. The change applies from your next message, with nothing to restart.",
            params: {
                enabled:
                    "true to show alcohol in meals, goals and progress, false to hide it",
                drink_unit:
                    "Which standard drink to show alongside the grams: <code>us</code> (14 g per drink) or <code>uk</code> (7.9 g per unit). Defaults to <code>us</code>; grams of pure ethanol are what's actually stored.",
            },
            example: "Start tracking my drinking, in UK units",
        },
        delete_account: {
            description:
                "Permanently delete your Nutrition MCP account and all the data it stores about you. This is irreversible, so the tool does nothing without an explicit confirmation, and the AI is asked to check with you before sending it.",
            params: {},
            example: "Delete my account and all my data",
        },
    },
    troubleshooting: {
        pillLabel: "Help",
        title: "Troubleshooting",
        description: "Something not working? Most problems have a quick fix.",
        stillStuck: "Still stuck?",
        items: {
            "cannot-connect": {
                question:
                    "The connector won't connect, or keeps asking me to sign in",
                answerHtml:
                    "Remove the connector and add it again with exactly <code>https://nutrition-mcp.com/mcp</code> — the <code>/mcp</code> part is required. In Claude, open <strong>Customize</strong> → <strong>Connectors</strong>, disconnect Nutrition and connect it again; in ChatGPT, use <strong>Settings</strong> → <strong>Apps</strong>. Sign in with the same email and password, or the same Google account, you used before: your data belongs to your account, not to the connection, so reconnecting loses nothing. Once connected, it stays connected as long as you use it at least every 90 days; if it stops working, reconnecting the same way fixes it.",
            },
            "session-expired": {
                question: 'The sign-in page shows {"error":"session_expired"}',
                answerHtml:
                    "The sign-in page is only valid for 10 minutes, and it also resets whenever the server restarts for an update. Go back to the sign-in page and reload it, or start connecting again from your AI app, then sign in without a long pause. If it shows <code>session_mismatch</code> instead, the sign-in was finished in a different browser from the one that opened it: start again from your AI app and finish in that same browser.",
            },
            "cannot-sign-in": {
                question: "I can't sign in, or I forgot my password",
                answerHtml:
                    'Use <strong>Sign in</strong> for an account you already have: a wrong email or password there shows "Wrong email or password" and never creates a new account. <strong>Create account</strong> is only for your first visit. Check the email for typos. If you created your account with <strong>Continue with Google</strong>, use that button again. There is no self-service password reset yet: email <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a> from the address on your account and I will reset it.',
            },
            "history-missing": {
                question: "I reconnected and my history is gone",
                answerHtml:
                    'Each email address is a separate account, so signing in with a different email starts an empty one — nothing was deleted. Disconnect and sign in again with the address you used originally. If you are not sure which one that was, email <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
            "tools-not-used": {
                question: "The AI answers but doesn't log anything",
                answerHtml:
                    'Make sure the connector is switched on for this conversation — in Claude, check the tools menu in the message box — and ask directly, for example "log my breakfast in Nutrition". If your app asks for permission to use a tool, approve it.',
            },
            "wrong-day": {
                question: "My meals show up on the wrong day",
                answerHtml:
                    'Days are counted in your timezone, and if you have never set one, UTC is used. Ask "what timezone do I have set?" (<a href="#get_profile"><code>get_profile</code></a>) and, if it is wrong, "set my timezone to Europe/Berlin" (<a href="#set_timezone"><code>set_timezone</code></a>). Everything you have logged is then grouped by your local day, past entries included. The one exception is an entry you gave a specific time of day while the timezone was wrong: it keeps the moment it was saved as, so it can still sit an hour or a day off — ask the AI to move it to the right date and time (<a href="#update_meal"><code>update_meal</code></a>). Set your timezone before importing history, too: imported meals keep the moment they were placed at, and importing another app\'s file again after changing the timezone adds them a second time. A Nutrition MCP export is recognized and not duplicated.',
            },
            "no-widgets": {
                question: "I only see text, no charts or cards",
                answerHtml:
                    'The visual cards need an app that supports interactive MCP Apps panels, such as Claude or ChatGPT; other clients get the same information as text. If you turned widgets off, ask to turn them back on (<a href="#set_widget_display"><code>set_widget_display</code></a>) and start a new conversation — an open chat keeps its old setting until it reconnects. The small card after logging a meal only appears once you have set daily goals (<a href="#set_nutrition_goals"><code>set_nutrition_goals</code></a>).',
            },
            "import-problems": {
                question: "The importer won't open, or says it can't save",
                answerHtml:
                    'The importer panel needs an app that shows interactive panels and has widgets turned on. If it says <em>This host does not let this view write to your log</em>, or it does not appear at all, ask the AI to import the file itself: attach or paste the CSV and it will use <a href="#bulk_import_meals"><code>bulk_import_meals</code></a>, which checks every row and skips duplicates, so re-sending is safe as long as your timezone has not changed in between. Set your timezone before the first import: re-importing another app\'s file after a change adds the rows again. If you use the importer panel and want an alcohol column kept, turn alcohol tracking on first — the panel skips that column while tracking is off, and re-importing later will not fill it in.',
            },
            "rate-limited": {
                question:
                    'I see "Rate limit exceeded" or "Too many failed authentication attempts"',
                answerHtml:
                    "Each account can make 60 requests a minute, and each tool call counts as at least one. Wait for the number of seconds the message gives, then carry on. For backfilling many meals, use the importer rather than logging them one by one. Sign-in pages allow 30 requests a minute per network. After 20 rejected connection attempts in a row from one network — usually an old, disconnected connector still retrying — connections from that network are paused for 5 minutes, and repeat pauses grow to at most an hour. Removing the old connector and adding it again stops the retries.",
            },
            "barcode-not-found": {
                question: "A barcode isn't found, or its numbers look wrong",
                answerHtml:
                    "Barcode data comes from Open Food Facts, a community database, so some products are missing and some entries are out of date. Make sure all 8–14 digits under the barcode were read correctly. If the product is not there, the AI can estimate from the name or from a photo of the nutrition label, and you can correct any figure afterwards. Adding the product on openfoodfacts.org helps everyone. Open Food Facts has no caffeine data, so caffeine comes from the label or typical amounts.",
            },
            "usda-unavailable": {
                question: 'The AI says "USDA data is unavailable until …"',
                answerHtml:
                    "Generic-food lookups go to USDA FoodData Central with one API key shared by every user of this server, and USDA caps how many requests that key may make each hour. The server stops calling USDA in three cases: after USDA reports its limit is reached, which pauses calls for 60 minutes; while the key's remaining hourly allowance is nearly used up; and once you have made 30 USDA lookups in the last hour. The message gives the time USDA opens again, in your profile timezone (UTC when none is set). Search results are not stored, so searches wait until then. A food looked up in the last 30 days is kept on the server, so it still works during a pause, and fetching a stored food does not count toward your 30 an hour. USDA names are English only, so search in English. Packaged products are not affected: look them up by barcode instead.",
            },
            "health-sync-yesterday": {
                question: "Yesterday isn't in Apple Health yet",
                answerHtml:
                    'Apple Health sync sends only finished days. A day counts as finished at 05:00 the next morning in your timezone, so yesterday arrives with the first sync after 05:00 today, and today never shows in Health until tomorrow. A sync runs when one of the shortcut\'s automations fires (opening the Health app, stopping your alarm) or when you run <strong>Nutrition MCP Health</strong> in the Shortcuts app and choose <strong>Sync now</strong>. A missed morning catches up on its own: every sync looks back over the last 7 days. Days follow the timezone on your profile (<a href="#get_profile"><code>get_profile</code></a>), or the one your iPhone reported when you connected if you never set one (<a href="#wrong-day">meals on the wrong day</a>). Days before you connected are only sent if you chose to bring back up to 7 earlier days while connecting.',
            },
            "health-sync-higher": {
                question: "Apple Health shows more than my chat",
                answerHtml:
                    "Apple Health can add to a value but can never lower one it already holds. A meal you add to a day that was already sent follows as a small extra entry at 12:01, 12:02 and so on, as long as the day is within the last 7 days. A meal you delete or make smaller after its day was sent leaves Health higher, and the shortcut shows a notice saying by how much. To fix it, open the Health app, go to <strong>Browse</strong> → <strong>Nutrition</strong>, open the type (for example Dietary Energy), tap <strong>Show All Data</strong>, delete that day's entries from Shortcuts and enter the right total by hand. Never use <strong>Delete All Data from Shortcuts</strong>: it also removes what your other shortcuts logged. If every day looks doubled, another app writes the same types too and Health adds the two together: switch one of them off under <strong>Sharing</strong> → <strong>Apps</strong> in the Health app.",
            },
            "health-sync-stopped": {
                question: "Apple Health sync stopped",
                answerHtml:
                    "Open the Shortcuts app and run <strong>Nutrition MCP Health</strong> by hand: it says what went wrong. If it asks you to connect again, the connection has ended (after 90 days without a sync, 365 days after connecting, or after <strong>Disconnect</strong>): run it, sign in on the page it opens with the same account as in your AI app, and finish within 30 minutes. If it syncs when you run it but not on its own, check that its automations in the Shortcuts app's <strong>Automation</strong> tab are on and set to <strong>Run Immediately</strong>. If a notice says a day did not reach Apple Health, let Shortcuts write every nutrition type under <strong>Sharing</strong> → <strong>Apps</strong> → <strong>Shortcuts</strong> in the Health app, then run it again. Connecting a new iPhone replaces the old one's connection.",
            },
            "export-link": {
                question: "My export download link doesn't work",
                answerHtml:
                    'Export links expire after 60 minutes, and each new export replaces the previous file. Ask for a fresh export (<a href="#export_all_data"><code>export_all_data</code></a>) and download it right away. If the export reports 0 meals when you expected your history, you are probably signed in with a different email — see <a href="#history-missing">history is gone</a>.',
            },
            "delete-account": {
                question: "How do I delete my account?",
                answerHtml:
                    'Ask the AI to delete your Nutrition MCP account (<a href="#delete_account"><code>delete_account</code></a>). It will ask you to confirm, then permanently delete your meals, saved meals, water, weight, body measurements, goals, settings, the record of which tools your AI app used, any export file, your sign-in and the account itself. This cannot be undone, so export your data first if you want a copy. Then remove the connector from your app. Signing in again with the same email later creates a new, empty account.',
            },
            "report-a-problem": {
                question: "How do I report a bug or a security issue?",
                answerHtml:
                    'Report bugs on <a href="https://github.com/akutishevsky/nutrition-mcp/issues" target="_blank" rel="noopener noreferrer">GitHub Issues</a>: say which app you use (Claude, ChatGPT, …), what you asked, what happened and roughly when. Never include your password. Please do not report security problems publicly: report them privately through <a href="https://github.com/akutishevsky/nutrition-mcp/security/advisories/new" target="_blank" rel="noopener noreferrer">GitHub private vulnerability reporting</a> or by email, as the <a href="https://github.com/akutishevsky/nutrition-mcp/security/policy" target="_blank" rel="noopener noreferrer">security policy</a> describes. For anything else, email <a href="mailto:anton@nutrition-mcp.com">anton@nutrition-mcp.com</a>.',
            },
        },
    },
};

export const TOOLS_COPY: Partial<Record<SiteLocale, ToolsDoc>> = {
    en: TOOLS_EN,
    de: TOOLS_DE,
    es: TOOLS_ES,
    fr: TOOLS_FR,
    nl: TOOLS_NL,
    pl: TOOLS_PL,
    it: TOOLS_IT,
    uk: TOOLS_UK,
    ja: TOOLS_JA,
    tr: TOOLS_TR,
};
