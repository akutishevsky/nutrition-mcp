import { MUNCH_APP_VERSION } from "./widget-release.js";

// Assemble self-contained MCP App widget HTML from shared source partials.
// Production exposes only user-facing widgets. The component gallery remains
// available to local development and tests, but can never be linked by a
// production tool response.

const SRC_DIR = "./public/widgets/src";
const INCLUDE_RE = /\/\*@include\s+([^\s@]+)\s*@\*\//g;
const INLINE_TS_RE = /\/\*@inlinets\s+([^\s@]+)\s*@\*\//g;
const WIDGET_VERSION_TOKEN = "__MUNCH_WIDGET_APP_VERSION__";

export const USER_WIDGET_TEMPLATES: Record<string, string> = {
    "nutrition-summary": "nutrition-summary.html",
    "goal-progress": "goal-progress.html",
    "meal-logged": "meal-logged.html",
    "meal-review": "meal-review.html",
    trends: "trends.html",
    "weight-trends": "weight-trends.html",
    "import-meals": "import-meals.html",
    "cook-summary": "cook-summary.html",
    "meal-plan": "meal-plan.html",
    "grocery-list": "grocery-list.html",
    pantry: "pantry.html",
    "day-meals": "day-meals.html",
    "food-label": "food-label.html",
    recipe: "recipe.html",
};

export const DEVELOPMENT_WIDGET_TEMPLATES: Record<string, string> = {
    "component-gallery": "component-gallery.html",
};

export const ALL_WIDGET_TEMPLATES: Record<string, string> = {
    ...USER_WIDGET_TEMPLATES,
    ...DEVELOPMENT_WIDGET_TEMPLATES,
};

export const WIDGET_TEMPLATES: Record<string, string> =
    process.env.NODE_ENV === "production"
        ? USER_WIDGET_TEMPLATES
        : ALL_WIDGET_TEMPLATES;

const cache = new Map<string, string>();

async function readSrc(relPath: string): Promise<string> {
    const file = Bun.file(`${SRC_DIR}/${relPath}`);
    if (!(await file.exists())) {
        throw new Error(`widget source partial not found: ${relPath}`);
    }
    return file.text();
}

async function inlineTs(relPath: string): Promise<string> {
    const file = Bun.file(`./${relPath}`);
    if (!(await file.exists())) {
        throw new Error(`@inlinets source not found: ${relPath}`);
    }
    const ts = await file.text();
    if (/^\s*import\s/m.test(ts)) {
        throw new Error(
            `@inlinets ${relPath} has runtime imports; only self-contained modules can be inlined`,
        );
    }
    const js = new Bun.Transpiler({ loader: "ts" }).transformSync(ts);
    return js
        .replace(/^export\s+default\s+/gm, "")
        .replace(/^export\s+/gm, "")
        .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, "");
}

async function resolveIncludes(text: string, stack: string[]): Promise<string> {
    const matches = [...text.matchAll(INCLUDE_RE)];
    if (matches.length === 0) return text;
    const resolved = new Map<string, string>();
    for (const match of matches) {
        const rel = match[1];
        if (!rel || resolved.has(rel)) continue;
        if (stack.includes(rel)) {
            throw new Error(`@include cycle: ${[...stack, rel].join(" -> ")}`);
        }
        const raw = await readSrc(rel);
        resolved.set(rel, await resolveIncludes(raw, [...stack, rel]));
    }
    return text.replace(INCLUDE_RE, (_full, rel) => resolved.get(rel) ?? "");
}

async function assemble(templateFile: string): Promise<string> {
    const templatePath = `templates/${templateFile}`;
    const template = await readSrc(templatePath);
    const withPartials = await resolveIncludes(template, [templatePath]);
    const matches = [...withPartials.matchAll(INLINE_TS_RE)];
    let assembled = withPartials;
    if (matches.length > 0) {
        const compiled = new Map<string, string>();
        for (const match of matches) {
            const rel = match[1];
            if (!rel || compiled.has(rel)) continue;
            compiled.set(rel, await inlineTs(rel));
        }
        assembled = withPartials.replace(
            INLINE_TS_RE,
            (_full, rel) => compiled.get(rel) ?? "",
        );
    }
    return assembled.replaceAll(WIDGET_VERSION_TOKEN, MUNCH_APP_VERSION);
}

export async function getWidgetHtml(key: string): Promise<string> {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const templateFile = WIDGET_TEMPLATES[key];
    if (!templateFile) throw new Error(`unknown widget: ${key}`);
    const html = await assemble(templateFile);
    cache.set(key, html);
    return html;
}

export async function warmWidgets(): Promise<void> {
    await Promise.all(Object.keys(WIDGET_TEMPLATES).map(getWidgetHtml));
}
