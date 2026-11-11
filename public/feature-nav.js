// Feature toggles (brief addendum 10, T6) — the data-driven nav.
//
// The navigation destinations live here as a MODEL, not as whatever
// markup a page happens to ship: each destination names the module
// that owns it (or null for the always-on core), and rendering a nav
// means reconciling its DOM with the model filtered by the account's
// feature flags. The all-on render is exactly the six-destination
// bottom nav (Today / Plan / Recipes / Groceries / Pantry / More) and
// the nine-row sidebar the shell has always shipped; with modules off
// the nav is honestly shorter — Today / More at the limit.
//
// Rendering reuses the page's own anchor elements wherever they
// exist, so packaged-bundle URL rewriting (which rewrites the static
// files at build time) keeps working; an anchor is created from the
// model only when the page did not ship one. This module is shared
// by the app shell (app.js) and the standalone Pantry page
// (pantry.js) and must stay dependency-free: the mobile bundle
// rewrites only the app-api import in its consumers.

export const FEATURE_MODULE_KEYS = [
    "plan",
    "recipes",
    "groceries",
    "pantry",
    "cooks",
];

export const FEATURE_MODULE_LABELS = {
    plan: "Meal Plan",
    recipes: "Recipes",
    groceries: "Groceries",
    pantry: "Pantry",
    cooks: "Cooks",
};

/**
 * Only an explicit false hides a module — a missing or malformed
 * flag set reads as every module on, so a bootstrap that failed to
 * carry the flags can never hide a module by accident.
 */
export function normalizeFeatureFlags(value) {
    const source =
        value && typeof value === "object" && !Array.isArray(value)
            ? value
            : {};
    const flags = {};
    for (const key of FEATURE_MODULE_KEYS) flags[key] = source[key] !== false;
    return flags;
}

/** SPA route name → owning module, for the routes a toggle closes. */
export const ROUTE_FEATURE_MODULES = {
    plan: "plan",
    recipes: "recipes",
    groceries: "groceries",
    cooks: "cooks",
};

export function moduleOffNotice(module) {
    return `${FEATURE_MODULE_LABELS[module]} is turned off — re-enable it in Settings`;
}

const MODULE_OFF_NOTICE_KEY = "munch-module-off-notice";

export function queueModuleOffNotice(module) {
    try {
        sessionStorage.setItem(MODULE_OFF_NOTICE_KEY, module);
    } catch {
        // Storage can be unavailable (private modes); the redirect
        // itself still lands on Today, only the line is lost.
    }
}

export function takeModuleOffNotice() {
    try {
        const module = sessionStorage.getItem(MODULE_OFF_NOTICE_KEY);
        if (module) sessionStorage.removeItem(MODULE_OFF_NOTICE_KEY);
        return FEATURE_MODULE_KEYS.includes(module) ? module : null;
    } catch {
        return null;
    }
}

// The bottom nav: the six destinations of the navigation brief, in
// order. `module: null` marks the spine (T2) — always rendered.
export const BOTTOM_NAV_MODEL = [
    { route: "today", href: "/app", icon: "◉", label: "Today", module: null },
    {
        route: "plan",
        href: "/app/plan",
        icon: "□",
        label: "Plan",
        module: "plan",
    },
    {
        route: "recipes",
        href: "/app/recipes",
        icon: "◇",
        label: "Recipes",
        module: "recipes",
    },
    {
        route: "groceries",
        href: "/app/groceries",
        icon: "✓",
        label: "Groceries",
        module: "groceries",
    },
    {
        route: "pantry",
        href: "/app/pantry",
        icon: "▦",
        label: "Pantry",
        module: "pantry",
    },
    {
        route: "more",
        href: "/app/more",
        icon: "•••",
        label: "More",
        module: null,
    },
];

// The shell sidebar's application nav, in shipped order. History,
// Trends, and Household are core (never toggleable, T2).
export const SIDEBAR_NAV_MODEL = [
    { route: "today", href: "/app", icon: "◉", label: "Today", module: null },
    {
        route: "log",
        href: "/app/log",
        icon: "▤",
        label: "History",
        module: null,
    },
    {
        route: "trends",
        href: "/app/trends",
        icon: "↗",
        label: "Trends",
        module: null,
    },
    {
        route: "recipes",
        href: "/app/recipes",
        icon: "◇",
        label: "Recipes",
        module: "recipes",
    },
    {
        route: "cooks",
        href: "/app/cooks",
        icon: "♨",
        label: "Cooks",
        module: "cooks",
    },
    {
        route: "plan",
        href: "/app/plan",
        icon: "□",
        label: "Meal Plan",
        module: "plan",
    },
    {
        route: "groceries",
        href: "/app/groceries",
        icon: "✓",
        label: "Groceries",
        module: "groceries",
    },
    {
        route: "pantry",
        href: "/app/pantry",
        icon: "▦",
        label: "Pantry",
        module: "pantry",
    },
    {
        route: "household",
        href: "/app/household",
        icon: "⌂",
        label: "Household",
        module: null,
    },
];

function createNavAnchor(entry, sidebar) {
    const anchor = document.createElement("a");
    anchor.dataset.route = entry.route;
    anchor.href = entry.href;
    const icon = document.createElement("span");
    if (sidebar) icon.className = "nav-icon";
    icon.textContent = entry.icon;
    const label = document.createElement("span");
    label.textContent = entry.label;
    anchor.append(icon, label);
    return anchor;
}

/**
 * Reconcile one nav element with the model under the given flags:
 * enabled destinations in model order, disabled ones removed. The
 * bottom nav's grid columns follow the rendered count so the items
 * always take equal shares of the bar (mobile_qc P1) at whatever
 * length the flags produce. Returns the rendered destination count.
 */
export function renderNav(nav, model, features, { sidebar = false } = {}) {
    if (!nav) return 0;
    const flags = normalizeFeatureFlags(features);
    const existing = new Map();
    for (const anchor of nav.querySelectorAll("a[data-route]")) {
        if (!existing.has(anchor.dataset.route)) {
            existing.set(anchor.dataset.route, anchor);
        }
    }
    let count = 0;
    for (const entry of model) {
        if (entry.module && !flags[entry.module]) continue;
        const anchor =
            existing.get(entry.route) ?? createNavAnchor(entry, sidebar);
        existing.delete(entry.route);
        nav.append(anchor);
        count += 1;
    }
    for (const leftover of existing.values()) leftover.remove();
    if (nav.classList.contains("mobile-bottom-nav")) {
        nav.style.gridTemplateColumns = `repeat(${count}, minmax(0, 1fr))`;
    }
    return count;
}

/** Render every nav the current page carries (shell: both; pantry: bottom). */
export function applyFeatureNav(features) {
    const bottom = document.querySelector(".mobile-bottom-nav");
    if (bottom) renderNav(bottom, BOTTOM_NAV_MODEL, features);
    const sidebar = document.querySelector(
        '.app-nav[aria-label="Application navigation"]',
    );
    if (sidebar)
        renderNav(sidebar, SIDEBAR_NAV_MODEL, features, { sidebar: true });
}
