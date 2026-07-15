// Assembles the self-contained widget HTML from shared source partials at
// server startup, so the shared design tokens, components, and MCP Apps host
// bridge live in exactly one place instead of being copy-pasted into five files.
//
// Nothing generated is committed: sources live under public/widgets/src/
// (templates/ + shared/), and each widget is stitched together on first use
// (and warmed at boot) into a single inlined HTML string, then cached. The
// iframe CSP forbids external CSS/JS, so "reuse" means inlining the partials —
// which is exactly what the `@include` markers below do.
//
// Template syntax: a partial is pulled in with a marker that is a valid CSS *and*
// JS comment, so a template still parses on its own:
//
//     /*@include shared/tokens.css@*/
//     /*@include shared/bridge.js@*/
//
// Markers resolve relative to public/widgets/src/ and expand recursively.

const SRC_DIR = "./public/widgets/src";
const INCLUDE_RE = /\/\*@include\s+([^\s@]+)\s*@\*\//g;

// ui:// resource name → template file under src/templates/.
export const WIDGET_TEMPLATES: Record<string, string> = {
    "nutrition-summary": "nutrition-summary.html",
    "goal-progress": "goal-progress.html",
    "meal-logged": "meal-logged.html",
    trends: "trends.html",
    "weight-trends": "weight-trends.html",
};

const cache = new Map<string, string>();

async function readSrc(relPath: string): Promise<string> {
    const file = Bun.file(`${SRC_DIR}/${relPath}`);
    if (!(await file.exists())) {
        throw new Error(`widget source partial not found: ${relPath}`);
    }
    return file.text();
}

// Expand every @include marker in `text`, recursively, guarding against cycles.
async function resolveIncludes(
    text: string,
    fromPath: string,
    stack: string[],
): Promise<string> {
    const matches = [...text.matchAll(INCLUDE_RE)];
    if (matches.length === 0) return text;

    // Resolve each unique partial once, then substitute.
    const resolved = new Map<string, string>();
    for (const m of matches) {
        const rel = m[1];
        if (!rel || resolved.has(rel)) continue;
        if (stack.includes(rel)) {
            throw new Error(`@include cycle: ${[...stack, rel].join(" -> ")}`);
        }
        const raw = await readSrc(rel);
        resolved.set(rel, await resolveIncludes(raw, rel, [...stack, rel]));
    }
    return text.replace(INCLUDE_RE, (_full, rel) => resolved.get(rel) ?? "");
}

async function assemble(templateFile: string): Promise<string> {
    const template = await readSrc(`templates/${templateFile}`);
    return resolveIncludes(template, templateFile, [
        `templates/${templateFile}`,
    ]);
}

// Return the fully-inlined HTML for a widget, assembling+caching on first use.
export async function getWidgetHtml(key: string): Promise<string> {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const templateFile = WIDGET_TEMPLATES[key];
    if (!templateFile) throw new Error(`unknown widget: ${key}`);
    const html = await assemble(templateFile);
    cache.set(key, html);
    return html;
}

// Assemble every widget once so a broken partial/marker fails fast at startup
// rather than on a client's first tool call.
export async function warmWidgets(): Promise<void> {
    await Promise.all(
        Object.keys(WIDGET_TEMPLATES).map((key) => getWidgetHtml(key)),
    );
}
