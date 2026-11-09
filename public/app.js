import { requestJson } from "./app-api.js";
import { shouldShowAndroidBanner } from "./ads-policy.js";
import {
    displayWeightUnit,
    savedWeightUnit,
    weightFromGrams,
} from "./weight-display.js";
import {
    accountRoutes,
    accountTitles,
    handleAccountAction,
    handleAccountSubmit,
    isAccountRoute,
    renderAccountRoute,
} from "./app-account.js";

const state = {
    bootstrap: null,
    route: "today",
    date: null,
    mealHistoryDays: 1,
    mealHistoryQuery: "",
    insightsDays: 30,
    cookQuery: "",
    cookFilters: {
        dish: "",
        method: "",
        flavor: "",
        dateFrom: "",
        dateTo: "",
        status: "all",
    },
    waterEntries: [],
    weightEntries: [],
    guided: { context: null, draft: null, groceries: null, latestSwap: null },
    controller: null,
};

const mealComposer = {
    items: [],
    options: new Map(),
    searchTimer: null,
};

const mealDraftReview = {
    draft: null,
    options: new Map(),
    pendingManual: [],
    searchTimer: null,
};

const recipeComposer = {
    ingredients: [],
    options: new Map(),
    searchTimer: null,
};

const recipeCompose = {
    groceryItems: [],
};

const recipeImport = {
    draft: null,
    progressTimer: null,
    controller: null,
};

const recipeImportSteps = [
    {
        label: "Checking the URL",
        detail: "Verifying the address and contacting the public recipe page.",
    },
    {
        label: "Parsing recipe details",
        detail: "Reading ingredients, servings, timing, and instructions.",
    },
    {
        label: "Interpreting ingredient language",
        detail: "Applying reasonable defaults to alternatives, ranges, and preparation words.",
    },
    {
        label: "Matching ingredients",
        detail: "Comparing ingredients with nutrition sources.",
    },
    {
        label: "Preparing your review",
        detail: "Calculating nutrition and building the editable recipe.",
    },
];

const savedFoodManager = {
    options: new Map(),
    foods: [],
};

const webMealImport = {
    table: null,
    mapping: {},
    dateFormat: "iso",
    energyUnit: "kcal",
    sourceApp: "",
    rows: [],
    skipped: 0,
    warnings: [],
    preview: null,
    result: null,
    fileName: "",
    busy: false,
};

const recipeNutrientFields = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "sodium_mg",
];

const content = document.getElementById("app-content");
const pageTitle = document.getElementById("page-title");
const pageKicker = document.getElementById("page-kicker");
const refreshButton = document.getElementById("refresh-button");
const quickAction = document.getElementById("quick-action");
const toastRegion = document.getElementById("toast-region");
const dialog = document.getElementById("app-dialog");

const routes = {
    "/app": "today",
    "/app/": "today",
    "/app/log": "log",
    "/app/insights": "insights",
    "/app/foods": "foods",
    "/app/recipes": "recipes",
    "/app/cooks": "cooks",
    "/app/plan": "plan",
    "/app/groceries": "groceries",
    ...accountRoutes,
};

const titles = {
    today: ["Daily workspace", "Today"],
    log: ["Nutrition history", "Food Log"],
    insights: ["Patterns and progress", "Insights"],
    foods: ["Reusable nutrition data", "Foods"],
    recipes: ["Structured cooking memory", "Recipes"],
    cooks: ["Cooking sessions", "Cooks"],
    plan: ["Personal and household", "Meal Plan"],
    groceries: ["Shopping workspace", "Groceries"],
    ...accountTitles,
};

const sourceLabels = {
    usda: "USDA",
    open_food_facts: "Open Food Facts",
    published_restaurant: "Published restaurant",
    saved_food: "Saved food",
    past_meal: "Past meal",
    user_supplied: "User supplied",
    model_estimate: "Estimated",
    legacy_aggregate: "Legacy entry",
};

const sourceClasses = {
    usda: "source-usda",
    open_food_facts: "source-off",
    published_restaurant: "source-restaurant",
    saved_food: "source-saved",
    past_meal: "source-saved",
    user_supplied: "confidence-chip",
    model_estimate: "source-estimate",
    legacy_aggregate: "confidence-chip",
};

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function dateInTimezone(timeZone) {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timeZone || "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const parts = Object.fromEntries(
        formatter
            .formatToParts(new Date())
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}`;
}

function shiftDate(date, days) {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
}

function formatDate(date, options = {}) {
    return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: options.year ? "numeric" : undefined,
        weekday: options.weekday ? "long" : undefined,
        timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`));
}

function formatTime(value, timezone) {
    if (!value) return "Time not recorded";
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone || state.bootstrap?.profile?.timezone || "UTC",
    }).format(new Date(value));
}

function number(value, digits = 0) {
    if (value == null || Number.isNaN(Number(value))) return "—";
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
    }).format(Number(value));
}

function percent(value, target) {
    if (!target || target <= 0) return null;
    return Math.max(
        0,
        Math.min(100, Math.round((Number(value || 0) / target) * 100)),
    );
}

function sourceBadge(type) {
    const label = sourceLabels[type] || type || "Source unavailable";
    const className = sourceClasses[type] || "confidence-chip";
    return `<span class="source-chip ${className}">${escapeHtml(label)}</span>`;
}

function confidenceBadge(value) {
    if (value == null) return "";
    const label =
        value >= 0.85
            ? "High confidence"
            : value >= 0.6
              ? "Medium confidence"
              : "Low confidence";
    return `<span class="confidence-chip">${label}</span>`;
}

function toast(message, kind = "success") {
    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    if (kind === "error") element.style.borderColor = "var(--danger-700)";
    toastRegion.append(element);
    window.setTimeout(() => element.remove(), 4200);
}

async function api(path, options = {}) {
    if (state.controller) state.controller.abort();
    const controller = new AbortController();
    if (!options.keepPrevious) state.controller = controller;
    return requestJson(path, {
        ...options,
        signal: options.signal || controller.signal,
    });
}

function syncAndroidAdPlacement() {
    if (typeof window.MunchAds?.setBannerVisible !== "function") return;
    const adFree = state.bootstrap?.androidEntitlements?.adFree;
    const visible = shouldShowAndroidBanner({
        route: state.route,
        pathname: location.pathname,
        dialogOpen: dialog.open,
        adFree,
    });
    void window.MunchAds.setBannerVisible({
        visible,
        adFree: adFree !== false,
    }).catch(() => {});
}

function setLoading(label = "Loading your Munch workspace…") {
    content.innerHTML = `<div class="loading-state"><div><div class="skeleton" style="width:180px;height:18px"></div><div class="skeleton spacer-top" style="width:min(70vw,360px);height:54px"></div><p class="spacer-top">${escapeHtml(label)}</p></div></div>`;
}

function errorState(error) {
    if (error?.name === "AbortError") return;
    content.innerHTML = `<div class="error-state"><div><h2>That view could not be loaded.</h2><p>${escapeHtml(error?.message || "An unexpected error occurred.")}</p><button class="button button-primary spacer-top" data-action="refresh">Try again</button></div></div>`;
}

function setActiveRoute(route) {
    const moreRoutes = new Set([
        "more",
        "household",
        "insights",
        "foods",
        "recipes",
        "settings",
        "settings-profile",
        "settings-goals",
        "settings-billing",
        "settings-connections",
        "settings-data",
        "settings-account",
    ]);
    const primaryRoute = route.startsWith("settings-") ? "settings" : route;
    document.querySelectorAll("[data-route]").forEach((link) => {
        const requested = link.dataset.route;
        const active =
            requested === primaryRoute ||
            (requested === "more" && moreRoutes.has(route));
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    });
    const [kicker, title] = titles[route] || titles.today;
    pageKicker.textContent = kicker;
    pageTitle.textContent = title;
    document.title = `${title} — Munch`;
}

function metricCard(label, value, unit, target, primary = false) {
    const progress = percent(value, target);
    return `<article class="summary-card ${primary ? "primary" : ""}"><span>${escapeHtml(label)}</span><strong>${number(value, 1)}${unit ? `<small>${escapeHtml(unit)}</small>` : ""}</strong><small>${target ? `${number(target, 1)} ${escapeHtml(unit)} target` : "No target set"}</small>${progress == null ? "" : `<div class="progress" aria-label="${progress}% of target"><span style="width:${progress}%"></span></div>`}</article>`;
}

function mealItems(items) {
    if (!items?.length)
        return `<div class="food-items"><div class="food-row"><div><strong>Legacy aggregate entry</strong><small>Item-level details were not recorded for this meal.</small></div></div></div>`;
    return `<div class="food-items">${items
        .map(
            (item) =>
                `<div class="food-row"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.portionLabel || (item.quantity ? `${number(item.quantity, 2)} serving` : "Portion not recorded"))}</small><div class="demo-source-row">${sourceBadge(item.sourceType)}${confidenceBadge(item.confidence)}</div>${item.assumptions?.length ? `<small>Assumptions: ${escapeHtml(item.assumptions.join("; "))}</small>` : ""}</div><strong>${item.calories == null ? "—" : `${number(item.calories)} kcal`}</strong></div>`,
        )
        .join("")}</div>`;
}

function waterEntryRows(entries) {
    const visible = [...(entries || [])].reverse().slice(0, 100);
    if (!visible.length)
        return `<div class="empty-state"><div><h3>No water entries</h3><p>Add a hydration entry to track intake here.</p></div></div>`;
    return `<div class="food-items">${visible
        .map((entry) => {
            const id = entry.id;
            const amount = entry.amount_ml ?? entry.amountMl;
            const loggedAt = entry.logged_at ?? entry.loggedAt;
            return `<div class="food-row"><div><strong>${number(amount)} ml</strong><small>${escapeHtml(formatTime(loggedAt))}${entry.loggedOn ? ` · ${escapeHtml(formatDate(entry.loggedOn, { year: true }))}` : ""}${entry.notes ? ` · ${escapeHtml(entry.notes)}` : ""}</small></div><div class="auth-actions"><button class="button button-secondary button-small" type="button" data-action="edit-water" data-id="${escapeHtml(id)}">Edit</button><button class="button button-quiet button-small" type="button" data-action="delete-water" data-id="${escapeHtml(id)}">Delete</button></div></div>`;
        })
        .join(
            "",
        )}</div>${entries.length > visible.length ? `<p class="tiny">Showing the most recent ${visible.length} of ${entries.length} entries.</p>` : ""}`;
}

function weightEntryRows(entries, fallbackUnit) {
    const visible = [...(entries || [])].reverse().slice(0, 100);
    if (!visible.length)
        return `<div class="empty-state"><div><h3>No weight entries</h3><p>Add a measurement to build a trend.</p></div></div>`;
    return `<div class="food-items">${visible
        .map((entry) => {
            const id = entry.id;
            const unit = entry.unit || fallbackUnit;
            const value =
                entry.value ??
                (entry.weight_g == null
                    ? null
                    : weightFromGrams(entry.weight_g, unit));
            const loggedAt = entry.logged_at ?? entry.loggedAt;
            return `<div class="food-row"><div><strong>${number(value, 1)} ${escapeHtml(unit)}</strong><small>${escapeHtml(formatTime(loggedAt))}${entry.loggedOn ? ` · ${escapeHtml(formatDate(entry.loggedOn, { year: true }))}` : ""}${entry.notes ? ` · ${escapeHtml(entry.notes)}` : ""}</small></div><div class="auth-actions"><button class="button button-secondary button-small" type="button" data-action="edit-weight" data-id="${escapeHtml(id)}">Edit</button><button class="button button-quiet button-small" type="button" data-action="delete-weight" data-id="${escapeHtml(id)}">Delete</button></div></div>`;
        })
        .join(
            "",
        )}</div>${entries.length > visible.length ? `<p class="tiny">Showing the most recent ${visible.length} of ${entries.length} entries.</p>` : ""}`;
}

function weightChart(days, unit, target) {
    if (!days?.length)
        return `<div class="empty-state"><div><h3>No weight trend yet</h3><p>Log a measurement to see the range trend.</p></div></div>`;
    const width = 720;
    const height = 220;
    const padX = 38;
    const padY = 24;
    const values = days.map((day) => Number(day.weight));
    const allValues = target == null ? values : [...values, Number(target)];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const span = max - min || 1;
    const x = (index) =>
        days.length === 1
            ? width / 2
            : padX + (index / (days.length - 1)) * (width - padX * 2);
    const y = (value) =>
        height - padY - ((value - min) / span) * (height - padY * 2);
    const points = days.map((day, index) => `${x(index)},${y(day.weight)}`);
    const targetLine =
        target == null
            ? ""
            : `<line x1="${padX}" y1="${y(target)}" x2="${width - padX}" y2="${y(target)}" stroke="var(--amber-600)" stroke-dasharray="6 5" /><text x="${width - padX}" y="${Math.max(14, y(target) - 7)}" text-anchor="end" fill="var(--amber-700)" font-size="12">Target ${number(target, 1)} ${escapeHtml(unit)}</text>`;
    return `<div role="img" aria-label="Weight trend in ${escapeHtml(unit)}"><svg viewBox="0 0 ${width} ${height}" width="100%" height="220" preserveAspectRatio="none" style="overflow:visible"><line x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}" stroke="var(--ink-200)" />${targetLine}<polyline points="${points.join(" ")}" fill="none" stroke="var(--green-600)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />${days.map((day, index) => `<circle cx="${x(index)}" cy="${y(day.weight)}" r="5" fill="var(--green-700)" /><text x="${x(index)}" y="${height - 5}" text-anchor="middle" fill="var(--ink-500)" font-size="11">${escapeHtml(day.date.slice(5))}</text>`).join("")}</svg></div><p class="tiny">Daily values average multiple weigh-ins; displayed in ${escapeHtml(unit)}.</p>`;
}

function mealCard(meal) {
    const type = meal.meal_type || "snack";
    return `<article class="meal-card" data-meal-id="${escapeHtml(meal.id)}"><div class="meal-card-head"><div><h4>${escapeHtml(meal.description || "Untitled meal")}</h4><div class="meal-meta"><span>${escapeHtml(formatTime(meal.logged_at))}</span><span>${escapeHtml(type)}</span>${meal.notes ? `<span>${escapeHtml(meal.notes)}</span>` : ""}</div></div><strong>${meal.calories == null ? "—" : `${number(meal.calories)} kcal`}</strong></div><div class="meal-macros"><span class="macro-chip">Protein ${number(meal.protein_g, 1)}g</span><span class="macro-chip">Carbs ${number(meal.carbs_g, 1)}g</span><span class="macro-chip">Fat ${number(meal.fat_g, 1)}g</span>${meal.fiber_g == null ? "" : `<span class="macro-chip">Fiber ${number(meal.fiber_g, 1)}g</span>`}${meal.sugar_g == null ? "" : `<span class="macro-chip">Sugar ${number(meal.sugar_g, 1)}g</span>`}</div>${mealItems(meal.items)}<div class="auth-actions"><button class="button button-secondary button-small" data-action="view-meal-details" data-id="${escapeHtml(meal.id)}">View details</button><button class="button button-secondary button-small" data-action="edit-meal" data-id="${escapeHtml(meal.id)}">Edit</button><button class="button button-quiet button-small" data-action="duplicate-meal" data-id="${escapeHtml(meal.id)}">Duplicate</button><button class="button button-quiet button-small" data-action="delete-meal" data-id="${escapeHtml(meal.id)}">Delete</button></div></article>`;
}

function groupedMeals(meals) {
    const order = ["breakfast", "lunch", "dinner", "snack"];
    const groups = Object.groupBy(
        meals || [],
        (meal) => meal.meal_type || "snack",
    );
    return `<div class="meal-groups">${order
        .map((type) => {
            const entries = groups[type] || [];
            const total = entries.reduce(
                (sum, meal) => sum + (meal.calories || 0),
                0,
            );
            return `<section class="meal-group"><header class="meal-group-header"><div><span class="meal-dot ${type}"></span><strong>${type[0].toUpperCase() + type.slice(1)}</strong></div><span>${entries.length ? `${number(total)} kcal` : "No entries"}</span></header>${entries.length ? entries.map(mealCard).join("") : `<div class="meal-card"><p>No ${type} logged.</p></div>`}</section>`;
        })
        .join("")}</div>`;
}

function pendingDraftCard(draft) {
    const status =
        draft.openQuestionCount > 0
            ? `${draft.openQuestionCount} question${draft.openQuestionCount === 1 ? "" : "s"} remaining`
            : draft.status === "awaiting_confirmation"
              ? "Ready for confirmation"
              : "Needs review";
    return `<article class="meal-card"><strong>${escapeHtml(draft.description || `${draft.sourceMode} meal`)}</strong><p>${escapeHtml(status)} · ${draft.itemCount} item${draft.itemCount === 1 ? "" : "s"}</p><div class="auth-actions"><button class="button button-secondary button-small" type="button" data-action="open-meal-draft" data-id="${escapeHtml(draft.id)}">Review draft</button></div></article>`;
}

async function renderToday() {
    setLoading("Loading today’s meals and progress…");
    const data = await api(
        `/api/app/today?date=${encodeURIComponent(state.date)}`,
    );
    const guidance = await api(
        `/api/app/guidance/today?date=${encodeURIComponent(state.date)}`,
        { keepPrevious: true },
    );
    state.waterEntries = data.water?.entries || [];
    state.weightEntries = data.weight || [];
    const goals = data.goals || {};
    const latestWeight = data.weight?.at(-1);
    const weightUnit = displayWeightUnit(
        state.bootstrap?.profile?.preferred_weight_unit,
    );
    const latestWeightValue = latestWeight
        ? weightFromGrams(latestWeight.weight_g, weightUnit)
        : null;
    const guidancePanel = `<section class="panel panel-span-12"><div class="panel-title"><div><h3>Today’s guidance</h3><span>${guidance.source_status === "sparse_data" ? "Limited recorded data" : "Based on recorded data"}</span></div><span class="source-chip source-saved">${escapeHtml(guidance.objective || "Track only")}</span></div><ul>${(guidance.actions || []).map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul><p class="tiny spacer-top">Planned meals are not counted as eaten. Unlogged meals remain unknown.</p></section>`;
    content.innerHTML = `<div class="page-heading"><div><h2>${escapeHtml(formatDate(state.date, { weekday: true }))}</h2><p>Your structured nutrition record for this day.</p></div><div class="auth-actions"><button class="button button-secondary button-small" data-action="date-prev">Previous</button><button class="button button-secondary button-small" data-action="date-today">Today</button><button class="button button-secondary button-small" data-action="date-next">Next</button></div></div><div class="dashboard-grid">${guidancePanel}<section class="panel panel-span-12"><div class="summary-grid">${metricCard("Calories", data.totals.calories, " kcal", goals.daily_calories, true)}${metricCard("Protein", data.totals.proteinG, "g", goals.daily_protein_g)}${metricCard("Carbohydrates", data.totals.carbsG, "g", goals.daily_carbs_g)}${metricCard("Fat", data.totals.fatG, "g", goals.daily_fat_g)}</div></section><section class="panel panel-span-8"><div class="panel-title"><h3>Meals</h3><span>${data.meals.length} logged</span></div>${groupedMeals(data.meals)}</section><aside class="panel panel-span-4"><div class="panel-title"><h3>Daily details</h3></div><div class="summary-grid" style="grid-template-columns:1fr 1fr">${metricCard("Water", data.water.totalMl, " ml", goals.daily_water_ml)}${metricCard("Weight", latestWeightValue, ` ${weightUnit}`, null)}</div><div class="auth-actions"><button class="button button-secondary button-small" data-action="add-water">Add water</button><button class="button button-secondary button-small" data-action="add-weight">Add weight</button></div><div class="panel-title spacer-top"><h3>Hydration entries</h3><span>${state.waterEntries.length}</span></div>${waterEntryRows(state.waterEntries)}<div class="panel-title spacer-top"><h3>Weight entries</h3><span>${state.weightEntries.length}</span></div>${weightEntryRows(state.weightEntries, weightUnit)}${data.drafts?.length ? `<div class="panel-title spacer-top"><h3>Pending drafts</h3><span>${data.drafts.length}</span></div><div class="meal-groups">${data.drafts.map(pendingDraftCard).join("")}</div>` : ""}${data.plannedMeals?.length ? `<div class="panel-title spacer-top"><h3>Planned today</h3><span>${data.plannedMeals.length}</span></div>${data.plannedMeals.map((meal) => `<div class="food-row"><div><strong>${escapeHtml(meal.recipe_name)}</strong><small>${escapeHtml(meal.meal_slot || "Meal")} · ${number(meal.servings, 1)} servings</small></div><span>${meal.nutrition_per_serving?.calories ? `${number(meal.nutrition_per_serving.calories * meal.servings)} kcal` : ""}</span></div>`).join("")}` : ""}</aside></div>`;
}

function mealSearchSummary(search) {
    if (!search) return "";
    const variations = search.variations || [];
    return `<section class="panel spacer-top"><div class="panel-title"><div><h3>Recurring variations</h3><span>${number(search.resultCount)} matching entr${search.resultCount === 1 ? "y" : "ies"}</span></div><span class="source-chip source-saved">Search</span></div>${variations.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Variation</th><th>Typical nutrition</th><th>Last logged</th></tr></thead><tbody>${variations.map((variation) => `<tr><td><strong>${escapeHtml(variation.label)}</strong><br /><small>${number(variation.count)} logged</small></td><td>${variation.typicalCalories == null ? "—" : `${number(variation.typicalCalories)} kcal · P ${number(variation.typicalProteinG, 1)}g · C ${number(variation.typicalCarbsG, 1)}g · F ${number(variation.typicalFatG, 1)}g`}</td><td>${escapeHtml(formatDate(variation.lastLoggedAt.slice(0, 10), { year: true }))}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><div><h3>No matching variations</h3><p>Try a shorter food name or a different keyword.</p></div></div>`}</section>`;
}

async function renderLog() {
    setLoading("Loading your food history…");
    const historyDays = [1, 30, 90, 365].includes(state.mealHistoryDays)
        ? state.mealHistoryDays
        : 1;
    const start = shiftDate(state.date, -(historyDays - 1));
    const query = state.mealHistoryQuery.trim();
    const search = query ? `&q=${encodeURIComponent(query)}` : "";
    const data = await api(
        `/api/app/meals?start=${encodeURIComponent(start)}&end=${encodeURIComponent(state.date)}${search}`,
    );
    const rangeButtons = [1, 30, 90, 365]
        .map(
            (range) =>
                `<button class="button ${range === historyDays ? "button-primary" : "button-secondary"} button-small" data-action="meal-history-range" data-days="${range}" aria-pressed="${range === historyDays}">${range === 1 ? "Day" : `${range} days`}</button>`,
        )
        .join("");
    const heading =
        historyDays === 1
            ? formatDate(state.date, { weekday: true })
            : `Last ${historyDays} days`;
    const resultText = query
        ? `${number(data.meals.length)} matching meal${data.meals.length === 1 ? "" : "s"} from ${escapeHtml(formatDate(start))} through ${escapeHtml(formatDate(state.date))}.`
        : `Review meals, item-level provenance, notes, and totals from ${escapeHtml(formatDate(start))} through ${escapeHtml(formatDate(state.date))}.`;
    content.innerHTML = `<div class="page-heading"><div><h2>${escapeHtml(heading)}</h2><p>${resultText}</p></div><div class="auth-actions"><button class="button button-secondary button-small" type="button" data-action="manage-saved-foods">Saved foods</button><button class="button button-secondary button-small" data-action="date-prev">Previous</button><button class="button button-secondary button-small" data-action="date-today">Today</button><button class="button button-secondary button-small" data-action="date-next">Next</button></div></div><section class="panel"><form id="meal-history-search-form" class="meal-composer-search-row"><label class="field" style="flex:1"><span>Search meal history</span><input class="input" id="meal-history-search" name="query" type="search" value="${escapeHtml(query)}" placeholder="Search chicken, peanut butter, restaurant…" autocomplete="off" /></label><div class="auth-actions"><button class="button button-primary button-small" type="submit">Search</button>${query ? '<button class="button button-quiet button-small" type="button" data-action="clear-meal-search">Clear</button>' : ""}</div></form><div class="auth-actions spacer-top">${rangeButtons}</div></section><section class="panel spacer-top"><div class="summary-grid">${metricCard("Calories", data.totals.calories, " kcal", null, true)}${metricCard("Protein", data.totals.proteinG, "g", null)}${metricCard("Carbohydrates", data.totals.carbsG, "g", null)}${metricCard("Fat", data.totals.fatG, "g", null)}</div></section>${mealSearchSummary(data.search)}<div class="spacer-top">${data.meals.length ? groupedMeals(data.meals) : `<div class="empty-state"><div><h3>${query ? "No matching meals" : "No meals logged"}</h3><p>${query ? "Try another keyword or expand the date range." : "Log a meal to build your history."}</p></div></div>`}</div>`;
}

function savedFoodListMarkup(foods) {
    if (!foods?.length) {
        return `<div class="empty-state"><div><h3>No saved foods yet</h3><p>Search for a verified food below to save a reusable snapshot.</p></div></div>`;
    }
    return `<div class="food-items">${foods
        .map((food) => {
            const snapshot = food.food || {};
            const portion = foodPortion(snapshot, food.defaultPortionId);
            return `<div class="food-row"><div><strong>${escapeHtml(food.label)}</strong><small>${sourceBadge(food.provider || snapshot.provider)} ${escapeHtml(foodTitle(snapshot))} · ${escapeHtml(portion?.label || "Choose a portion when logging")} · used ${number(food.useCount)} time${food.useCount === 1 ? "" : "s"}</small></div><button class="button button-quiet button-small" type="button" data-action="delete-saved-food" data-id="${escapeHtml(food.id)}">Remove</button></div>`;
        })
        .join("")}</div>`;
}

function savedFoodManagerMarkup(data) {
    const limit =
        data.limit == null
            ? "No limit"
            : `${number(data.total)} of ${number(data.limit)}`;
    return `<p class="tiny">Saved foods retain the verified nutrition snapshot, so the same food can be reused even when a provider is unavailable.</p><form id="saved-food-search-form" class="meal-composer-search-row"><label class="field" style="flex:1"><span>Find a verified food to save</span><input class="input" id="saved-food-search" name="query" type="search" placeholder="Search oats, yogurt, chicken…" autocomplete="off" /></label><button class="button button-secondary" type="submit">Search</button></form><div id="saved-food-search-results" class="meal-food-results"><p class="tiny">Search for a provider food, then choose its label and default portion.</p></div><section class="meal-draft-section"><div class="panel-title"><div><h3>Your saved foods</h3><span>${escapeHtml(limit)}</span></div></div><div id="saved-food-list">${savedFoodListMarkup(data.foods)}</div></section>`;
}

async function openSavedFoodsManager() {
    const data = await api("/api/app/foods", { keepPrevious: true });
    savedFoodManager.foods = data.foods || [];
    savedFoodManager.options.clear();
    openDialog("Saved foods", savedFoodManagerMarkup(data));
}

function renderSavedFoodSearchResults(data) {
    const root = document.getElementById("saved-food-search-results");
    if (!root) return;
    savedFoodManager.options.clear();
    if (!data.candidates?.length) {
        root.innerHTML = `<p class="tiny">No verified provider foods matched that search.</p>`;
        return;
    }
    root.innerHTML = `<div class="meal-search-section"><h4>Verified foods</h4>${data.candidates
        .map((candidate, index) => {
            const key = `candidate:${index}`;
            savedFoodManager.options.set(key, {
                candidateId: candidate.candidate_id,
            });
            return `<button class="meal-search-result" type="button" data-action="select-saved-food-candidate" data-key="${key}"><span><strong>${escapeHtml([candidate.brand, candidate.name].filter(Boolean).join(" — ") || candidate.name)}</strong><small>${sourceBadge(candidate.provider)} ${escapeHtml(candidate.default_portion?.label || "Details available after selection")}</small></span><span class="button button-secondary button-small">Save</span></button>`;
        })
        .join("")}</div>`;
}

async function searchSavedFoodCandidates() {
    const input = document.getElementById("saved-food-search");
    const root = document.getElementById("saved-food-search-results");
    if (!input || !root) return;
    const query = input.value.trim();
    if (!query) {
        root.innerHTML = `<p class="tiny">Enter a food name to search verified providers.</p>`;
        return;
    }
    root.innerHTML = `<p class="tiny">Searching verified foods…</p>`;
    const data = await api(
        `/api/app/food-search?query=${encodeURIComponent(query)}&limit=8`,
        { keepPrevious: true },
    );
    renderSavedFoodSearchResults(data);
}

async function openSavedFoodCandidate(key) {
    const option = savedFoodManager.options.get(key);
    if (!option) return;
    const data = await api(
        `/api/app/food-details?candidate_id=${encodeURIComponent(option.candidateId)}`,
        { keepPrevious: true },
    );
    const food = data.food;
    if (!food) throw new Error("Food details are no longer available");
    const portions = food.portions || [];
    openDialog(
        "Save reusable food",
        `<form id="saved-food-form" class="auth-form" data-candidate-id="${escapeHtml(food.candidate_id)}"><p class="tiny">${escapeHtml(foodTitle(food))} · ${sourceBadge(food.provider)}</p><label class="field"><span>Your label</span><input name="label" maxlength="200" value="${escapeHtml(foodTitle(food))}" placeholder="My usual yogurt" required /></label><label class="field"><span>Default portion</span><select name="default_portion_id"><option value="">Choose when logging</option>${portions.map((portion, index) => `<option value="${escapeHtml(portion.id)}" ${index === 0 ? "selected" : ""}>${escapeHtml(portion.label)}</option>`).join("")}</select></label><div class="auth-actions"><button class="button button-quiet" type="button" data-action="manage-saved-foods">Back</button><button class="button button-primary" type="submit">Save food</button></div></form>`,
    );
}

function barChart(days, key, label, unit = "") {
    const values = days.map((day) => Number((day.totals || day)[key] || 0));
    const max = Math.max(1, ...values);
    return `<div role="img" aria-label="${escapeHtml(label)} by logged day" style="display:flex;align-items:flex-end;gap:5px;height:190px;padding-top:20px">${days
        .map((day, index) => {
            const height = values[index]
                ? Math.max(2, Math.round((values[index] / max) * 150))
                : 0;
            const opacity = day.hasLog === false ? 0.25 : 1;
            return `<div style="display:flex;min-width:0;flex:1;flex-direction:column;align-items:center;justify-content:flex-end;height:100%"><span class="tiny">${number(values[index])}</span><div style="width:100%;max-width:24px;height:${height}px;border-radius:7px 7px 2px 2px;background:var(--green-600);opacity:${opacity}"></div><span class="tiny">${escapeHtml(day.date.slice(5))}</span></div>`;
        })
        .join(
            "",
        )}</div><p class="tiny">${escapeHtml(label)} is shown for the selected calendar range${unit ? ` in ${escapeHtml(unit)}` : ""}; days without logs are shown as empty columns.</p>`;
}

async function renderInsights() {
    setLoading("Calculating trends and patterns…");
    const end = state.date;
    const days = [7, 30, 90].includes(state.insightsDays)
        ? state.insightsDays
        : 30;
    const start = shiftDate(end, -(days - 1));
    const data = await api(`/api/app/insights?start=${start}&end=${end}`);
    // The weekly check-in is a seven-day panel, so window its request to the
    // most recent seven days of the selected range. The check-in endpoint
    // only accepts one to seven days; passing the full 30/90-day trend range
    // made this request fail and took the whole Insights view down with it.
    const checkinStart = shiftDate(end, -6);
    const checkin = await api(
        `/api/app/insights/checkin?start=${checkinStart}&end=${end}`,
        { keepPrevious: true },
    );
    const vitals = data.vitals || {};
    const waterHistory = vitals.water || {};
    const weightTrend = vitals.weight || {};
    state.waterEntries = waterHistory.entries || [];
    state.weightEntries = weightTrend.entries || [];
    const rangeButtons = [7, 30, 90]
        .map(
            (range) =>
                `<button class="button ${range === days ? "button-primary" : "button-secondary"} button-small" data-action="insight-range" data-days="${range}" aria-pressed="${range === days}">${range} days</button>`,
        )
        .join("");
    const trendDays = data.trends?.days || data.days || [];
    const progress = data.progress || {};
    const progressGoals = progress.goals || {};
    const provenance = data.provenance || {};
    const coverage = provenance.coverage || {};
    const confidence = provenance.confidence || {};
    const sourceRows = (provenance.sources || [])
        .map(
            (source) =>
                `<tr><td>${escapeHtml(source.source)}</td><td>${number(source.itemCount)}</td><td>${number(source.percentOfItems, 1)}%</td><td>${number(source.calories, 1)} kcal</td></tr>`,
        )
        .join("");
    const calorieContributors = (provenance.contributors?.calories || [])
        .slice(0, 5)
        .map(
            (item) =>
                `<li><strong>${escapeHtml(item.name)}</strong> · ${number(item.value, 1)} kcal <span class="tiny">${escapeHtml(item.source)}</span></li>`,
        )
        .join("");
    const narrative = (title, text, open = false) =>
        `<details class="panel"${open ? " open" : ""}><summary class="panel-title"><h3>${escapeHtml(title)}</h3><span>View analysis</span></summary><pre style="margin:12px 0 0;white-space:pre-wrap;color:var(--ink-600);font:inherit;line-height:1.5">${escapeHtml(text || "No data in range.")}</pre></details>`;
    const waterHistoryPanel = `<section id="water-history" class="panel panel-span-6"><div class="panel-title"><div><h3>Hydration history</h3><span>${number(waterHistory.entries?.length || 0)} entries in range</span></div><span class="source-chip source-saved">Water</span></div><div class="summary-grid" style="grid-template-columns:1fr 1fr">${metricCard("Total water", waterHistory.totalMl, " ml", progressGoals.daily_water_ml, true)}${metricCard("Entries", waterHistory.entries?.length || 0, "", null)}</div><div class="auth-actions spacer-top"><button class="button button-secondary button-small" type="button" data-action="add-water">Add water</button></div><div class="spacer-top">${waterEntryRows(state.waterEntries)}</div></section>`;
    const weightDisplayUnit =
        weightTrend.unit ||
        displayWeightUnit(state.bootstrap?.profile?.preferred_weight_unit);
    const weightHistoryPanel = `<section id="weight-history" class="panel panel-span-6"><div class="panel-title"><div><h3>Weight history</h3><span>${number(weightTrend.entries?.length || 0)} entries in range</span></div><span class="source-chip source-saved">Weight</span></div>${weightChart(weightTrend.days || [], weightDisplayUnit, weightTrend.target)}<details class="spacer-top"><summary class="tiny">Trend explanation</summary><p class="tiny spacer-top">${escapeHtml(weightTrend.narrative || "No weight data in range.")}</p></details><div class="auth-actions spacer-top"><button class="button button-secondary button-small" type="button" data-action="add-weight">Add weight</button></div><div class="spacer-top">${weightEntryRows(state.weightEntries, weightDisplayUnit)}</div></section>`;
    const weeklyPanel = `<section class="panel panel-span-12"><div class="panel-title"><div><h3>Weekly check-in</h3><span>Coverage first; gaps are unknown, not zero</span></div><span class="source-chip source-saved">${checkin.coverage_percent}% coverage</span></div><div class="summary-grid">${metricCard("Days with recorded nutrition", checkin.nutrition_target_coverage_days, ` of ${checkin.calendar_days}`, null)}${metricCard("Recorded-day calories", checkin.averages_on_recorded_days.calories?.value, " kcal", null)}${metricCard("Recorded-day protein", checkin.averages_on_recorded_days.protein_g?.average, "g", null)}${metricCard("Meals with uncertain nutrition", checkin.uncertain_nutrition_meals, " meals", null)}</div><ul class="spacer-top">${checkin.observations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul><p class="tiny spacer-top">Targets reflect the goal revision effective during the selected week.</p></section>`;
    content.innerHTML = `<div class="page-heading"><div><h2>Last ${days} days</h2><p>${data.loggedDays} logged days and ${data.mealCount} meals from ${escapeHtml(formatDate(start))} through ${escapeHtml(formatDate(end))}.</p></div><div class="auth-actions">${rangeButtons}</div></div><div class="dashboard-grid">${weeklyPanel}<section class="panel panel-span-12"><div class="panel-title"><div><h3>Average intake</h3><span>Across logged days</span></div></div><div class="summary-grid">${metricCard("Average calories", data.averages.calories, " kcal", null, true)}${metricCard("Average protein", data.averages.proteinG, "g", null)}${metricCard("Average carbs", data.averages.carbsG, "g", null)}${metricCard("Average fat", data.averages.fatG, "g", null)}</div></section><section class="panel panel-span-8"><div class="panel-title"><div><h3>Daily calories</h3><span>${trendDays.length} calendar days</span></div><span class="source-chip source-usda">Trend</span></div>${trendDays.length ? barChart(trendDays, "calories", "Daily calories", "kilocalories") : `<div class="empty-state"><div><h3>No logged days</h3><p>Log meals to build a trend.</p></div></div>`}</section><section class="panel panel-span-4"><div class="panel-title"><div><h3>Selected-day progress</h3><span>${escapeHtml(formatDate(progress.date || end))}</span></div></div><div class="summary-grid" style="grid-template-columns:1fr 1fr">${metricCard("Calories", progress.totals?.calories, " kcal", progressGoals.daily_calories, true)}${metricCard("Protein", progress.totals?.proteinG, "g", progressGoals.daily_protein_g)}${metricCard("Carbohydrates", progress.totals?.carbsG, "g", progressGoals.daily_carbs_g)}${metricCard("Fat", progress.totals?.fatG, "g", progressGoals.daily_fat_g)}${metricCard("Water", progress.totals?.waterMl, " ml", progressGoals.daily_water_ml)}${metricCard("Meals", progress.mealCount, "", null)}</div><p class="tiny spacer-top">Progress is calculated for the selected range end date. Use Today to review a different day.</p></section><section class="panel panel-span-6"><div class="panel-title"><div><h3>Data coverage</h3><span>Where your nutrition came from</span></div></div><div class="summary-grid" style="grid-template-columns:1fr 1fr">${metricCard("Itemized calories", coverage.itemizedCaloriePercent, "%", 100, true)}${metricCard("Food items", coverage.itemCount, "", null)}${metricCard("Structured meals", coverage.structuredMealCount, "", null)}${metricCard("Legacy meals", coverage.legacyMealCount, "", null)}${metricCard("Recorded confidence", confidence.recordedItemCount, " items", null)}${metricCard("Average confidence", confidence.average == null ? null : confidence.average * 100, "%", null)}</div>${sourceRows ? `<div class="data-table-wrap spacer-top"><table class="data-table"><thead><tr><th>Source</th><th>Items</th><th>Share</th><th>Calories</th></tr></thead><tbody>${sourceRows}</tbody></table></div>` : `<p class="tiny spacer-top">No item-level provenance is recorded in this range.</p>`}</section><section class="panel panel-span-6"><div class="panel-title"><div><h3>Largest calorie contributors</h3><span>Top itemized foods</span></div></div>${calorieContributors ? `<ol class="spacer-top">${calorieContributors}</ol>` : `<p class="tiny">No itemized foods are available.</p>`}</section>${waterHistoryPanel}${weightHistoryPanel}<section class="panel panel-span-12"><div class="panel-title"><div><h3>Weight context</h3><span>Latest standing measurement</span></div></div>${progress.weight ? `<div class="summary-grid" style="grid-template-columns:repeat(3,1fr)">${metricCard("Latest weight", progress.weight.current, ` ${progress.weight.unit}`, progress.weight.target)}${metricCard("Target", progress.weight.target, ` ${progress.weight.unit}`, null)}${metricCard("Meals on selected day", progress.mealCount, "", null)}</div><p class="tiny spacer-top">Last logged ${escapeHtml(progress.weight.loggedOn || "date unavailable")}.</p>` : `<p class="tiny">No weight target or measurement is available yet.</p>`}</section>${narrative("Trend analysis", data.trends?.narrative, false)}${narrative("Meal patterns", data.patterns?.narrative, false)}</div>`;
}

async function renderFoods() {
    setLoading("Loading saved foods…");
    const data = await api("/api/app/foods");
    content.innerHTML = `<div class="page-heading"><div><h2>Saved foods</h2><p>${data.total} reusable food${data.total === 1 ? "" : "s"}${data.limit ? ` of ${data.limit}` : ""}.</p></div><div class="auth-actions"><input class="input" id="food-filter" type="search" placeholder="Filter saved foods" aria-label="Filter saved foods" /></div></div><section class="panel"><div id="food-list">${data.foods.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Food</th><th>Source</th><th>Default portion</th><th>Used</th><th>Last used</th></tr></thead><tbody>${data.foods.map((food) => `<tr data-food-label="${escapeHtml(food.label.toLowerCase())}"><td><strong>${escapeHtml(food.label)}</strong><br /><small>${escapeHtml(food.food?.brand || food.food?.name || "")}</small></td><td>${sourceBadge(food.provider)}</td><td>${escapeHtml(food.defaultPortionId || "Choose when logging")}</td><td>${number(food.useCount)}</td><td>${food.lastUsedAt ? escapeHtml(formatDate(food.lastUsedAt.slice(0, 10), { year: true })) : "Never"}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><div><h3>No saved foods yet</h3><p>Confirm a provider food in your AI assistant, then save it for reuse.</p></div></div>`}</div></section>`;
}

async function planningData() {
    const start = shiftDate(
        state.date,
        -((new Date(`${state.date}T12:00:00Z`).getUTCDay() + 6) % 7),
    );
    return api(`/api/app/planning?start=${start}&end=${shiftDate(start, 6)}`);
}

async function renderRecipes() {
    setLoading("Loading recipes…");
    const data = await planningData();
    const canCreate = Boolean(
        state.bootstrap?.capabilities?.recipeWrite ||
        state.bootstrap?.capabilities?.householdRecipeWrite,
    );
    const importButton = canCreate
        ? '<button class="button button-primary button-small" data-action="import-recipe-url">Import recipe from website</button>'
        : "";
    const createButton = canCreate
        ? '<button class="button button-secondary button-small" data-action="create-recipe">Create manually</button>'
        : "";
    const composeButton = canCreate
        ? '<button class="button button-secondary button-small" data-action="compose-recipe">Compose + plan</button>'
        : "";
    content.innerHTML = `<div class="page-heading"><div><h2>Recipe library</h2><p>${data.recipes.length} structured recipe${data.recipes.length === 1 ? "" : "s"}. Import from a website for review, or create a recipe manually.</p></div><div class="auth-actions">${importButton}${createButton}${composeButton}<input class="input" id="recipe-filter" type="search" placeholder="Filter recipes" aria-label="Filter recipes" /></div></div><div class="capability-grid" id="recipe-grid">${data.recipes.length ? data.recipes.map((recipe) => `<article class="capability-card" data-recipe-name="${escapeHtml(recipe.name.toLowerCase())}"><span class="source-chip ${recipe.ownership === "household" ? "source-saved" : "source-usda"}">${escapeHtml(recipe.ownership)}</span><h3 class="spacer-top">${escapeHtml(recipe.name)}</h3><p>${number(recipe.servings, 1)} servings · ${escapeHtml(recipe.nutrition_status)}</p><div class="meal-macros"><span class="macro-chip">${number(recipe.nutrition_per_serving?.calories)} kcal</span><span class="macro-chip">P ${number(recipe.nutrition_per_serving?.protein_g, 1)}g</span><span class="macro-chip">C ${number(recipe.nutrition_per_serving?.carbs_g, 1)}g</span><span class="macro-chip">F ${number(recipe.nutrition_per_serving?.fat_g, 1)}g</span></div><p class="tiny spacer-top">Scheduled ${number(recipe.times_scheduled)} times · logged ${number(recipe.times_logged)} times</p><button class="button button-secondary button-small spacer-top" type="button" data-action="view-recipe" data-id="${escapeHtml(recipe.recipe_id)}">View recipe</button></article>`).join("") : `<div class="empty-state"><div><h3>No recipes yet</h3><p>Import a recipe from a public website and review it before saving, or create one manually.</p>${canCreate ? `<div class="auth-actions spacer-top">${importButton}${createButton}</div>` : ""}</div></div>`}</div>`;
}

function recipeIngredientFromFood(food, portionId) {
    const portion = foodPortion(food, portionId);
    if (!portion) throw new Error("Food has no usable portion");
    const candidateId = food.candidate_id;
    return {
        name: foodTitle(food),
        quantity: 1,
        unit: portion.label,
        preparation: "",
        optional: false,
        gramWeight: portion.gram_weight ?? undefined,
        nutrients: portion.nutrients || {},
        provider: food.provider,
        providerFoodId: food.provider_food_id,
        sourceType: food.provider,
        sourceUrl: food.source_url || undefined,
        confidence: food.confidence,
        sourceSnapshot: {
            resolution_layer: "food_search",
            candidate_id: candidateId,
            provider: food.provider,
            provider_food_id: food.provider_food_id,
            selected_portion_id: portion.id,
            selected_portion_label: portion.label,
            selected_quantity: 1,
            nutrition_snapshot: portion.nutrients,
        },
    };
}

function recipeIngredientFromRecord(ingredient) {
    return {
        name: ingredient.name,
        quantity: ingredient.quantity ?? undefined,
        unit: ingredient.unit || "",
        preparation: ingredient.preparation || "",
        optional: Boolean(ingredient.optional),
        gramWeight: ingredient.gram_weight ?? undefined,
        nutrients: ingredient.nutrients || {},
        provider: ingredient.provider || undefined,
        providerFoodId: ingredient.provider_food_id || undefined,
        sourceType: ingredient.source_type || "user_supplied",
        sourceUrl: ingredient.source_url || undefined,
        confidence: ingredient.confidence ?? undefined,
        sourceSnapshot: ingredient.source_snapshot || {},
    };
}

function recipeIngredientFromRecent(recent) {
    return {
        name: recent.name,
        quantity: 1,
        unit: recent.portionLabel || "serving",
        preparation: "",
        optional: false,
        gramWeight: undefined,
        nutrients: recent.nutrients || {},
        provider: recent.provider || undefined,
        providerFoodId: recent.providerFoodId || undefined,
        sourceType: "past_meal",
        sourceUrl: undefined,
        confidence: recent.confidence ?? undefined,
        sourceSnapshot: {
            resolution_layer: "personal_history",
            meal_id: recent.mealId,
            item_id: recent.itemId,
        },
    };
}

function recipeComposeSectionMarkup() {
    return `<section class="recipe-editor-section"><div class="panel-title"><div><h3>Plan this recipe</h3><span>Save the recipe, schedule it, and add only the groceries you explicitly still need.</span></div></div><div class="meal-composer-grid"><label class="field"><span>Planned date</span><input name="planned_date" type="date" value="${escapeHtml(state.date)}" required /></label><label class="field"><span>Meal slot</span><select name="meal_slot"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner" selected>Dinner</option><option value="snack">Snack</option></select></label><label class="field"><span>Servings planned</span><input name="planned_servings" type="number" min="0.01" step="0.01" value="1" required /></label></div><label class="field"><span>Planning note</span><input name="note" maxlength="500" placeholder="Optional note for this planned meal" /></label><div class="panel-title spacer-top"><div><h3>Explicit grocery items</h3><span>Munch does not infer pantry inventory.</span></div><button class="button button-secondary button-small" type="button" data-action="add-recipe-grocery">Add grocery item</button></div><div id="recipe-compose-groceries"></div></section>`;
}

function recipeFormMarkup(mode, recipe = null) {
    const editing = mode === "edit";
    const composing = mode === "compose";
    const formId = editing
        ? "recipe-edit-form"
        : composing
          ? "recipe-compose-form"
          : "recipe-create-form";
    const scopeOptions = editing
        ? '<input type="hidden" name="scope" value="personal" />'
        : `<label class="field"><span>Save to</span><select name="scope">${state.bootstrap?.capabilities?.recipeWrite !== false ? '<option value="personal">Personal recipes</option>' : ""}${state.bootstrap?.capabilities?.householdRecipeWrite ? '<option value="household">Household recipes</option>' : ""}</select></label>`;
    const sourceType =
        recipe?.source?.type || recipe?.source_type || "user_entered";
    const sourceTitle = recipe?.source?.title || recipe?.source_title || "";
    const sourceUrl = recipe?.source?.url || recipe?.source_url || "";
    const imported = sourceType === "imported";
    const sourceTypeField = imported
        ? `<input type="hidden" name="source_type" value="imported" />`
        : `<label class="field"><span>Source type</span><select name="source_type"><option value="user_entered" ${sourceType === "user_entered" ? "selected" : ""}>User entered</option><option value="chatgpt_generated" ${sourceType === "chatgpt_generated" ? "selected" : ""}>ChatGPT generated</option><option value="imported" ${sourceType === "imported" ? "selected" : ""}>Imported</option></select></label>`;
    const sourceUrlField = imported
        ? `<input type="hidden" name="source_url" value="${escapeHtml(sourceUrl)}" />`
        : editing && sourceUrl
          ? `<label class="field"><span>Source URL</span><input name="source_url" type="url" maxlength="2000" value="${escapeHtml(sourceUrl)}" placeholder="https://…" /></label>`
          : "";
    const submitLabel = editing
        ? "Save new revision"
        : composing
          ? "Save, plan, and add groceries"
          : imported
            ? "Save imported recipe"
            : "Create recipe";
    return `<form id="${formId}" class="auth-form"${editing ? ` data-id="${escapeHtml(recipe.id)}" data-version="${escapeHtml(recipe.version)}"` : ""}><div class="meal-composer-grid"><label class="field"><span>Recipe name</span><input name="name" value="${escapeHtml(recipe?.name || "")}" maxlength="200" required /></label><label class="field"><span>Servings</span><input name="servings" type="number" min="0.01" step="0.01" value="${escapeHtml(recipe?.servings ?? 2)}" required /></label></div>${scopeOptions}<label class="field"><span>Description</span><textarea name="description" rows="2" maxlength="2000" placeholder="What is this recipe for?">${escapeHtml(recipe?.description || "")}</textarea></label><div class="meal-composer-grid"><label class="field"><span>Prep time (minutes)</span><input name="preparation_minutes" type="number" min="0" step="1" value="${escapeHtml(recipe?.preparation_minutes ?? "")}" /></label><label class="field"><span>Cook time (minutes)</span><input name="cooking_minutes" type="number" min="0" step="1" value="${escapeHtml(recipe?.cooking_minutes ?? "")}" /></label></div><section class="recipe-editor-section"><div class="panel-title"><div><h3>Ingredients</h3><span>Search verified foods or add your own.</span></div><button class="button button-secondary button-small" type="button" data-action="add-recipe-ingredient">Add ingredient</button></div><div class="meal-composer-search"><div class="meal-composer-search-row"><input class="input" id="recipe-food-search" type="search" placeholder="Search oats, yogurt, chicken…" autocomplete="off" /><span class="tiny">Food search facts are stored with this revision.</span></div><div id="recipe-food-results" class="meal-food-results"></div></div><div id="recipe-ingredients" class="meal-selected-items"></div></section><label class="field"><span>Instructions</span><textarea name="instructions" rows="6" maxlength="20000" placeholder="One step per line" required>${escapeHtml(recipe?.instructions?.join("\n") || "")}</textarea><small class="tiny">Put each instruction on its own line.</small></label><div class="meal-composer-grid"><label class="field"><span>Source title</span><input name="source_title" maxlength="500" value="${escapeHtml(sourceTitle)}" placeholder="Optional cookbook, site, or note" /></label>${sourceTypeField}</div>${sourceUrlField}${composing ? recipeComposeSectionMarkup() : ""}<button class="button button-primary" type="submit">${submitLabel}</button></form>`;
}

function renderRecipeIngredients() {
    const root = document.getElementById("recipe-ingredients");
    if (!root) return;
    if (recipeComposer.ingredients.length === 0) {
        root.innerHTML = `<div class="empty-state"><div><strong>No ingredients yet.</strong><p>Search for a food or add a manual ingredient.</p></div></div>`;
        return;
    }
    root.innerHTML = recipeComposer.ingredients
        .map((ingredient, index) => {
            const nutrients = ingredient.nutrients || {};
            return `<article class="meal-composer-item recipe-ingredient-editor" data-recipe-ingredient-index="${index}"><div class="meal-composer-item-head"><div><strong>${escapeHtml(ingredient.name || "New ingredient")}</strong><small>${sourceBadge(ingredient.sourceType || "user_supplied")} ${ingredient.provider ? escapeHtml(ingredient.provider) : "Nutrition can be entered below"}</small></div><button class="button button-quiet button-small" type="button" data-action="remove-recipe-ingredient" data-index="${index}">Remove</button></div><div class="meal-composer-grid"><label class="field"><span>Name</span><input data-recipe-field="name" value="${escapeHtml(ingredient.name || "")}" maxlength="300" required /></label><label class="field"><span>Quantity</span><input data-recipe-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(ingredient.quantity ?? "")}" /></label><label class="field"><span>Unit</span><input data-recipe-field="unit" maxlength="80" value="${escapeHtml(ingredient.unit || "")}" placeholder="cup, gram, serving…" /></label><label class="field"><span>Preparation</span><input data-recipe-field="preparation" maxlength="200" value="${escapeHtml(ingredient.preparation || "")}" placeholder="chopped, warmed…" /></label></div><label class="checkbox-row"><input data-recipe-field="optional" type="checkbox" ${ingredient.optional ? "checked" : ""} /> Optional ingredient</label><div class="meal-composer-nutrients">${recipeNutrientFields.map((key) => `<label class="field"><span>${escapeHtml(key.replace("_g", " (g)").replace("sodium_mg", "sodium (mg)"))}</span><input data-recipe-field="${key}" type="number" min="0" step="0.1" value="${escapeHtml(nutrients[key] ?? "")}" /></label>`).join("")}</div></article>`;
        })
        .join("");
}

function renderRecipeComposeGroceries() {
    const root = document.getElementById("recipe-compose-groceries");
    if (!root) return;
    if (recipeCompose.groceryItems.length === 0) {
        root.innerHTML = `<div class="empty-state"><div><strong>No grocery items added.</strong><p>Add only ingredients you explicitly still need.</p></div></div>`;
        return;
    }
    root.innerHTML = recipeCompose.groceryItems
        .map(
            (item, index) =>
                `<article class="meal-composer-item" data-recipe-grocery-index="${index}"><div class="meal-composer-item-head"><div><strong>${escapeHtml(item.name || "New grocery item")}</strong><small>Added only to the selected planning scope</small></div><button class="button button-quiet button-small" type="button" data-action="remove-recipe-grocery" data-index="${index}">Remove</button></div><div class="meal-composer-grid"><label class="field"><span>Name</span><input data-recipe-grocery-field="name" value="${escapeHtml(item.name || "")}" maxlength="300" required /></label><label class="field"><span>Quantity</span><input data-recipe-grocery-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity ?? "")}" /></label><label class="field"><span>Unit</span><input data-recipe-grocery-field="unit" maxlength="80" value="${escapeHtml(item.unit || "")}" placeholder="bunch, can, oz…" /></label><label class="field"><span>Note</span><input data-recipe-grocery-field="note" maxlength="500" value="${escapeHtml(item.note || "")}" placeholder="Optional" /></label></div></article>`,
        )
        .join("");
}

function syncRecipeComposeGroceriesFromDom() {
    const root = document.getElementById("recipe-compose-groceries");
    if (!root) return;
    root.querySelectorAll("[data-recipe-grocery-index]").forEach((row) => {
        const index = Number(row.dataset.recipeGroceryIndex);
        const item = recipeCompose.groceryItems[index];
        if (!item) return;
        const field = (name) =>
            row.querySelector(`[data-recipe-grocery-field="${name}"]`);
        const quantityValue = field("quantity")?.value;
        const quantity =
            quantityValue === "" || quantityValue == null
                ? undefined
                : Number(quantityValue);
        item.name = field("name")?.value || "";
        item.quantity = Number.isFinite(quantity) ? quantity : undefined;
        item.unit = field("unit")?.value || "";
        item.note = field("note")?.value || "";
    });
}

function recipeGroceryItemsPayload() {
    syncRecipeComposeGroceriesFromDom();
    return recipeCompose.groceryItems
        .filter((item) => item.name.trim())
        .map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit || undefined,
            note: item.note || undefined,
        }));
}

function renderRecipeSearchResults(data) {
    const root = document.getElementById("recipe-food-results");
    if (!root) return;
    recipeComposer.options.clear();
    const sections = [];
    if (data.candidates?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Verified foods</h4>${data.candidates
                .map((candidate, index) => {
                    const key = `candidate:${index}`;
                    recipeComposer.options.set(key, {
                        kind: "candidate",
                        candidateId: candidate.candidate_id,
                    });
                    return `<button class="meal-search-result" type="button" data-action="select-recipe-food-option" data-key="${key}"><span><strong>${escapeHtml([candidate.brand, candidate.name].filter(Boolean).join(" — ") || candidate.name)}</strong><small>${sourceBadge(candidate.provider)} ${escapeHtml(candidate.default_portion?.label || "Details available after selection")}</small></span><span>${candidate.default_portion?.calories == null ? "" : `${number(candidate.default_portion.calories)} kcal`}</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.savedFoods?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Saved foods</h4>${data.savedFoods
                .map((saved, index) => {
                    const key = `saved:${index}`;
                    recipeComposer.options.set(key, {
                        kind: "food",
                        food: saved.food,
                        portionId: saved.defaultPortionId,
                    });
                    return `<button class="meal-search-result" type="button" data-action="select-recipe-food-option" data-key="${key}"><span><strong>${escapeHtml(saved.label)}</strong><small>${sourceBadge(saved.food.provider)} ${escapeHtml(saved.food.name || "Saved food")}</small></span><span>${number(foodPortion(saved.food, saved.defaultPortionId)?.nutrients?.calories)} kcal</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.recentMealItems?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Recent foods</h4>${data.recentMealItems
                .map((recent, index) => {
                    const key = `recent:${index}`;
                    recipeComposer.options.set(key, { kind: "recent", recent });
                    return `<button class="meal-search-result" type="button" data-action="select-recipe-food-option" data-key="${key}"><span><strong>${escapeHtml(recent.name)}</strong><small>${sourceBadge("past_meal")} ${escapeHtml(recent.portionLabel || "Portion not recorded")}</small></span><span>${number(recent.nutrients?.calories)} kcal</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    root.innerHTML =
        sections.join("") ||
        `<p class="tiny">No matches yet. Try a food name or add a manual ingredient.</p>`;
}

async function searchRecipeFoods(query) {
    const root = document.getElementById("recipe-food-results");
    if (!root) return;
    root.innerHTML = `<p class="tiny">Searching verified foods and personal history…</p>`;
    try {
        const data = await api(
            `/api/app/food-search?query=${encodeURIComponent(query)}&limit=8`,
            { keepPrevious: true },
        );
        renderRecipeSearchResults(data);
    } catch (error) {
        if (error?.name !== "AbortError")
            root.innerHTML = `<p class="tiny">${escapeHtml(error.message || "Food search failed")}</p>`;
    }
}

async function selectRecipeFoodOption(key) {
    syncRecipeComposerFromDom();
    const option = recipeComposer.options.get(key);
    if (!option) return;
    if (option.kind === "candidate") {
        const data = await api(
            `/api/app/food-details?candidate_id=${encodeURIComponent(option.candidateId)}`,
            { keepPrevious: true },
        );
        if (!data.food) throw new Error("Food details are no longer available");
        recipeComposer.ingredients.push(
            recipeIngredientFromFood(data.food, data.food.portions?.[0]?.id),
        );
    } else if (option.kind === "food") {
        recipeComposer.ingredients.push(
            recipeIngredientFromFood(option.food, option.portionId),
        );
    } else {
        recipeComposer.ingredients.push(
            recipeIngredientFromRecent(option.recent),
        );
    }
    renderRecipeIngredients();
}

function syncRecipeComposerFromDom() {
    const root = document.getElementById("recipe-ingredients");
    if (!root) return;
    root.querySelectorAll("[data-recipe-ingredient-index]").forEach((row) => {
        const index = Number(row.dataset.recipeIngredientIndex);
        const ingredient = recipeComposer.ingredients[index];
        if (!ingredient) return;
        const field = (name) =>
            row.querySelector(`[data-recipe-field="${name}"]`);
        const numeric = (name) => {
            const value = field(name)?.value;
            if (value === "" || value == null) return undefined;
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        };
        ingredient.name = field("name")?.value || "";
        ingredient.quantity = numeric("quantity");
        ingredient.unit = field("unit")?.value || "";
        ingredient.preparation = field("preparation")?.value || "";
        ingredient.optional = Boolean(field("optional")?.checked);
        ingredient.gramWeight = numeric("gram_weight");
        ingredient.nutrients = Object.fromEntries(
            recipeNutrientFields
                .map((key) => [key, numeric(key)])
                .filter(([, value]) => value !== undefined),
        );
    });
}

function recipePayloadFromForm(values) {
    syncRecipeComposerFromDom();
    const instructions = String(values.instructions || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    return {
        name: values.name,
        servings: Number(values.servings),
        description: values.description || undefined,
        instructions,
        preparation_minutes:
            values.preparation_minutes === ""
                ? undefined
                : Number(values.preparation_minutes),
        cooking_minutes:
            values.cooking_minutes === ""
                ? undefined
                : Number(values.cooking_minutes),
        source_type: values.source_type,
        source_title: values.source_title || undefined,
        source_url: values.source_url || undefined,
        ingredients: recipeComposer.ingredients.map((ingredient) => ({
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit || undefined,
            preparation: ingredient.preparation || undefined,
            optional: ingredient.optional || undefined,
            gram_weight: ingredient.gramWeight,
            nutrients: ingredient.nutrients,
            provider: ingredient.provider,
            provider_food_id: ingredient.providerFoodId,
            source_type: ingredient.sourceType || "user_supplied",
            source_url: ingredient.sourceUrl,
            confidence: ingredient.confidence,
            source_snapshot: ingredient.sourceSnapshot,
        })),
    };
}

function stopRecipeImportProgress() {
    if (recipeImport.progressTimer) {
        window.clearTimeout(recipeImport.progressTimer);
        recipeImport.progressTimer = null;
    }
    if (recipeImport.controller) {
        recipeImport.controller.abort();
        recipeImport.controller = null;
    }
}

function updateRecipeImportProgress(index) {
    const root = document.getElementById("recipe-import-progress");
    if (!root) return;
    const stepIndex = Math.max(
        0,
        Math.min(index, recipeImportSteps.length - 1),
    );
    const step = recipeImportSteps[stepIndex];
    root.hidden = false;
    root.dataset.state = "loading";
    root.setAttribute("aria-busy", "true");
    root.querySelector("[data-import-progress-title]").textContent =
        `${step.label}…`;
    root.querySelector("[data-import-progress-detail]").textContent =
        step.detail;
    root.querySelectorAll("[data-import-step]").forEach((element) => {
        const elementIndex = Number(element.dataset.importStep);
        const state =
            elementIndex < stepIndex
                ? "complete"
                : elementIndex === stepIndex
                  ? "active"
                  : "pending";
        element.dataset.state = state;
        const marker = element.querySelector("[data-import-step-marker]");
        if (marker)
            marker.textContent =
                state === "complete" ? "✓" : `${elementIndex + 1}`;
    });
}

function startRecipeImportProgress() {
    stopRecipeImportProgress();
    updateRecipeImportProgress(0);
    const delays = [700, 1100, 1800, 1800];
    const advance = (index) => {
        if (index >= recipeImportSteps.length - 1) return;
        recipeImport.progressTimer = window.setTimeout(() => {
            updateRecipeImportProgress(index + 1);
            advance(index + 1);
        }, delays[index] || 1800);
    };
    advance(0);
}

function setRecipeImportProgressError(message) {
    stopRecipeImportProgress();
    const root = document.getElementById("recipe-import-progress");
    if (!root) return;
    root.hidden = false;
    root.dataset.state = "error";
    root.setAttribute("aria-busy", "false");
    root.querySelector("[data-import-progress-title]").textContent =
        "We could not import that page";
    root.querySelector("[data-import-progress-detail]").textContent =
        message || "Try another public recipe URL.";
    root.querySelectorAll("[data-import-step]").forEach((element) => {
        if (element.dataset.state === "active") element.dataset.state = "error";
    });
}

function recipeImportProgressMarkup() {
    return `<section id="recipe-import-progress" class="recipe-import-progress" hidden role="status" aria-live="polite" aria-busy="true"><div class="recipe-import-progress-heading"><span class="recipe-import-spinner" aria-hidden="true"></span><div><strong data-import-progress-title>Ready to check the page</strong><p data-import-progress-detail>Nothing is saved until you review and submit the recipe.</p></div></div><ol class="recipe-import-steps" aria-label="Recipe import progress">${recipeImportSteps.map((step, index) => `<li data-import-step="${index}" data-state="pending"><span data-import-step-marker aria-hidden="true">${index + 1}</span><span>${escapeHtml(step.label)}</span></li>`).join("")}</ol></section>`;
}

function recipeImportReviewMarkup(draft) {
    const review = draft.ingredient_review || [];
    const unresolved = review.filter(
        (item) =>
            item.resolution === "ambiguous" || item.resolution === "unresolved",
    );
    const resolved = review.filter(
        (item) =>
            item.resolution === "matched" || item.resolution === "assumed",
    );
    const warningMarkup = (draft.warnings || []).length
        ? `<div class="panel spacer-top"><strong>Review warnings</strong><ul class="food-items spacer-top">${draft.warnings.map((item) => `<li><span>${escapeHtml(item.message)}</span></li>`).join("")}</ul></div>`
        : "";
    const assumptionMarkup = (draft.assumptions || []).length
        ? `<div class="panel spacer-top"><strong>Assumptions applied automatically</strong><p class="tiny spacer-top">You can edit these below, but no ingredient-by-ingredient confirmation is required.</p><ul class="food-items spacer-top">${draft.assumptions.map((item) => `<li><span><strong>${escapeHtml(item.message)}</strong><small>${escapeHtml(item.raw_text)}</small></span></li>`).join("")}</ul></div>`
        : "";
    const unresolvedMarkup = unresolved.length
        ? `<div class="panel spacer-top"><strong>${unresolved.length} ingredient${unresolved.length === 1 ? "" : "s"} need${unresolved.length === 1 ? "s" : ""} review</strong><ul class="food-items spacer-top">${unresolved.map((item) => `<li><span><strong>${escapeHtml(item.raw_text)}</strong><small>${escapeHtml(item.resolution)} match · use the food search or edit the fields below</small></span></li>`).join("")}</ul></div>`
        : "";
    const nutrition = draft.nutrition?.per_serving || {};
    return `<div class="recipe-detail"><p>Preview only — nothing has been saved. Munch resolved what it could, applied reasonable assumptions, and left only materially uncertain ingredients for review.</p><p class="tiny"><a href="${escapeHtml(draft.source.final_url)}" target="_blank" rel="noreferrer">${escapeHtml(draft.source.final_url)}</a> · ${escapeHtml(draft.parser.strategy)} · ${resolved.length}/${review.length} ingredients resolved</p><div class="meal-macros spacer-top"><span class="macro-chip">${number(nutrition.calories)} kcal/serving</span><span class="macro-chip">P ${number(nutrition.protein_g, 1)}g</span><span class="macro-chip">C ${number(nutrition.carbs_g, 1)}g</span><span class="macro-chip">F ${number(nutrition.fat_g, 1)}g</span></div>${warningMarkup}${assumptionMarkup}${unresolvedMarkup}</div>`;
}

function recipeFormRecordFromImport(draft) {
    return {
        name: draft.recipe.name,
        servings: draft.recipe.servings,
        description: draft.recipe.description,
        instructions: draft.recipe.instructions,
        preparation_minutes: draft.recipe.preparation_minutes,
        cooking_minutes: draft.recipe.cooking_minutes,
        source_type: draft.recipe.source_type,
        source_title: draft.recipe.source_title,
        source_url: draft.recipe.source_url,
    };
}

function recipeComposerIngredientFromImport(ingredient) {
    return {
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit || "",
        preparation: ingredient.preparation || "",
        optional: Boolean(ingredient.optional),
        gramWeight: ingredient.gram_weight,
        nutrients: ingredient.nutrients || {},
        provider: ingredient.provider,
        providerFoodId: ingredient.provider_food_id,
        sourceType: ingredient.source_type || "user_supplied",
        sourceUrl: ingredient.source_url,
        confidence: ingredient.confidence,
        sourceSnapshot: ingredient.source_snapshot || {},
    };
}

function openRecipeImportReview(draft) {
    stopRecipeImportProgress();
    recipeImport.draft = draft;
    recipeComposer.ingredients = draft.recipe.ingredients.map(
        recipeComposerIngredientFromImport,
    );
    recipeComposer.options.clear();
    recipeCompose.groceryItems = [];
    openDialog(
        "Review imported recipe",
        `${recipeImportReviewMarkup(draft)}${recipeFormMarkup("create", recipeFormRecordFromImport(draft))}`,
    );
    renderRecipeIngredients();
    searchRecipeFoods("");
}

function openRecipeImport() {
    stopRecipeImportProgress();
    recipeImport.draft = null;
    openDialog(
        "Import recipe from a website",
        `<form id="recipe-import-url-form" class="auth-form"><p>Paste a public HTTPS recipe page. Munch will check the page, parse the recipe, interpret the ingredient language, match nutrition sources, and show you an editable review before anything is saved.</p><p class="tiny">This is separate from <strong>Create manually</strong>; you do not need to open the recipe editor first.</p><label class="field"><span>Recipe URL</span><input name="url" type="url" inputmode="url" maxlength="2000" placeholder="https://example.com/recipe" required /></label>${recipeImportProgressMarkup()}<button class="button button-primary" type="submit">Check recipe page</button></form>`,
    );
}

function openRecipeCreate() {
    recipeComposer.ingredients = [];
    recipeComposer.options.clear();
    recipeCompose.groceryItems = [];
    openDialog("Create recipe", recipeFormMarkup("create"));
    renderRecipeIngredients();
    searchRecipeFoods("");
}

function openRecipeCompose() {
    recipeComposer.ingredients = [];
    recipeComposer.options.clear();
    recipeCompose.groceryItems = [];
    openDialog("Compose recipe and meal plan", recipeFormMarkup("compose"));
    renderRecipeIngredients();
    renderRecipeComposeGroceries();
    searchRecipeFoods("");
}

async function openRecipe(id) {
    const data = await api(`/api/app/recipes/${encodeURIComponent(id)}`);
    const recipe = data.recipe;
    const ingredients = recipe.ingredients
        .map(
            (ingredient) =>
                `<li><strong>${escapeHtml(ingredient.name)}</strong><span>${ingredient.quantity == null ? "" : `${number(ingredient.quantity, 3)} ${escapeHtml(ingredient.unit || "")}`} · ${number(ingredient.nutrients?.calories)} kcal</span>${sourceBadge(ingredient.source_type)}</li>`,
        )
        .join("");
    openDialog(
        recipe.name,
        `<div class="recipe-detail"><p>${number(recipe.servings, 3)} servings · revision ${number(recipe.revision_number)} · ${escapeHtml(recipe.nutrition_status)}</p><div class="meal-macros"><span class="macro-chip">${number(recipe.nutrition_per_serving?.calories)} kcal/serving</span><span class="macro-chip">P ${number(recipe.nutrition_per_serving?.protein_g, 1)}g</span><span class="macro-chip">C ${number(recipe.nutrition_per_serving?.carbs_g, 1)}g</span><span class="macro-chip">F ${number(recipe.nutrition_per_serving?.fat_g, 1)}g</span></div><h3 class="spacer-top">Ingredients</h3><ul class="food-items">${ingredients}</ul><h3 class="spacer-top">Instructions</h3><ol class="recipe-instructions">${recipe.instructions.map((instruction) => `<li>${escapeHtml(instruction)}</li>`).join("") || "<li>No instructions recorded.</li>"}</ol><p class="tiny spacer-top">Every ingredient includes the source snapshot used to calculate this revision. Editing creates a new revision; historical logs stay pinned.</p><div class="auth-actions spacer-top"><button class="button button-primary" type="button" data-action="log-recipe" data-id="${escapeHtml(recipe.id)}" data-revision="${escapeHtml(recipe.revision_id)}">Log recipe</button><button class="button button-secondary" type="button" data-action="plan-recipe" data-id="${escapeHtml(recipe.id)}" data-revision="${escapeHtml(recipe.revision_id)}">Add to plan</button><button class="button button-secondary" type="button" data-action="archive-recipe" data-id="${escapeHtml(recipe.id)}" data-version="${escapeHtml(recipe.version)}">Archive</button></div><details class="spacer-top"><summary>Edit recipe revision</summary>${recipeFormMarkup("edit", recipe)}</details></div>`,
    );
    recipeComposer.ingredients = recipe.ingredients.map(
        recipeIngredientFromRecord,
    );
    recipeComposer.options.clear();
    renderRecipeIngredients();
    searchRecipeFoods("");
}

function openRecipeLog(id, revisionId) {
    openDialog(
        "Log saved recipe",
        `<form id="recipe-log-form" class="auth-form" data-id="${escapeHtml(id)}" data-revision="${escapeHtml(revisionId || "")}"><p>Use the saved ingredients and nutrition exactly as stored. Choose how much you ate.</p><label class="field"><span>Servings consumed</span><input name="servings_consumed" type="number" min="0.01" step="0.01" value="1" required /></label><label class="field"><span>Meal type</span><select name="meal_type"><option value="breakfast">Breakfast</option><option value="lunch" selected>Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><label class="field"><span>Notes</span><input name="notes" maxlength="4000" placeholder="Optional" /></label><button class="button button-primary" type="submit">Log meal</button></form>`,
    );
}

function openRecipePlan(id) {
    openDialog(
        "Add recipe to meal plan",
        `<form id="recipe-plan-form" class="auth-form" data-id="${escapeHtml(id)}"><label class="field"><span>Date</span><input name="planned_date" type="date" value="${escapeHtml(state.date)}" required /></label><label class="field"><span>Meal slot</span><select name="meal_slot"><option value="breakfast">Breakfast</option><option value="lunch" selected>Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><label class="field"><span>Servings planned</span><input name="servings" type="number" min="0.01" step="0.01" value="1" required /></label><button class="button button-primary" type="submit">Add to plan</button></form>`,
    );
}

function weekDays(start) {
    return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}

async function renderPlan() {
    setLoading("Loading the meal plan…");
    const data = await planningData();
    const start = shiftDate(
        state.date,
        -((new Date(`${state.date}T12:00:00Z`).getUTCDay() + 6) % 7),
    );
    const byDate = Object.groupBy(
        data.plannedMeals,
        (meal) => meal.planned_date,
    );
    content.innerHTML = `<div class="page-heading"><div><h2>Week of ${escapeHtml(formatDate(start))}</h2><p>Planned meals stay separate from foods you actually logged.</p></div><div class="auth-actions"><button class="button button-primary button-small" type="button" data-action="guided-planner">Guided planner</button><button class="button button-secondary button-small" type="button" data-action="guidance-preferences">Preferences</button><button class="button button-secondary button-small" data-action="date-week-prev">Previous week</button><button class="button button-secondary button-small" data-action="date-today">This week</button><button class="button button-secondary button-small" data-action="date-week-next">Next week</button></div></div><div class="meal-groups">${weekDays(
        start,
    )
        .map(
            (date) =>
                `<section class="meal-group"><header class="meal-group-header"><div><strong>${escapeHtml(formatDate(date, { weekday: true }))}</strong></div><span>${(byDate[date] || []).length} planned</span></header>${(byDate[date] || []).length ? (byDate[date] || []).map((meal) => `<article class="meal-card"><div class="meal-card-head"><div><h4>${escapeHtml(meal.recipe_name)}</h4><div class="meal-meta"><span>${escapeHtml(meal.meal_slot || "Meal")}</span><span>${escapeHtml(meal.ownership)}</span>${meal.created_by ? `<span>Added by ${escapeHtml(meal.created_by)}</span>` : ""}</div></div><strong>${number(meal.servings, 1)} servings</strong></div><div class="meal-macros"><span class="macro-chip">${number((meal.nutrition_per_serving?.calories || 0) * meal.servings)} kcal</span><span class="macro-chip">P ${number((meal.nutrition_per_serving?.protein_g || 0) * meal.servings, 1)}g</span></div><div class="auth-actions spacer-top"><button class="button button-secondary button-small" type="button" data-action="meal-swap" data-id="${escapeHtml(meal.planned_meal_id)}" data-version="${escapeHtml(meal.version)}">Swap recipe</button></div></article>`).join("") : `<div class="meal-card"><p>No meals planned.</p></div>`}</section>`,
        )
        .join("")}</div>`;
}

function currentWeekStart() {
    return shiftDate(
        state.date,
        -((new Date(`${state.date}T12:00:00Z`).getUTCDay() + 6) % 7),
    );
}

function csvList(value) {
    return String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function preferenceTextField(label, key, preferences) {
    const value = (preferences[key] || []).join(", ");
    return `<label class="field"><span>${escapeHtml(label)}</span><input class="input" name="${escapeHtml(key)}" value="${escapeHtml(value)}" maxlength="1200" placeholder="Separate items with commas" /></label>`;
}

function guidancePreferencesMarkup(preferences) {
    return `<form id="guidance-preferences-form" class="auth-form" data-version="${escapeHtml(preferences.version)}"><p>These preferences guide suggestions and safety checks. They do not change logged meals or set nutrition targets.</p><label class="field"><span>Objective</span><select name="objective"><option value="track_only" ${preferences.objective === "track_only" ? "selected" : ""}>Track only</option><option value="maintain" ${preferences.objective === "maintain" ? "selected" : ""}>Maintain weight</option><option value="gain" ${preferences.objective === "gain" ? "selected" : ""}>Gain weight</option><option value="lose" ${preferences.objective === "lose" ? "selected" : ""}>Lose weight</option></select></label><label class="check-row"><input type="checkbox" name="suggestions_enabled" ${preferences.suggestions_enabled ? "checked" : ""} /><span>Allow optional goal review prompts</span></label>${preferenceTextField("Allergies", "allergies", preferences)}${preferenceTextField("Excluded ingredients", "excluded_ingredients", preferences)}${preferenceTextField("Disliked ingredients", "disliked_ingredients", preferences)}${preferenceTextField("Liked ingredients", "liked_ingredients", preferences)}${preferenceTextField("Cuisines", "cuisines", preferences)}${preferenceTextField("Flavor preferences", "flavors", preferences)}${preferenceTextField("Available equipment", "equipment", preferences)}${preferenceTextField("Preferred cooking methods", "preferred_methods", preferences)}${preferenceTextField("Avoided cooking methods", "avoided_methods", preferences)}<label class="field"><span>Cooking difficulty</span><select name="difficulty"><option value="any" ${preferences.difficulty === "any" ? "selected" : ""}>Any</option><option value="easy" ${preferences.difficulty === "easy" ? "selected" : ""}>Easy</option><option value="moderate" ${preferences.difficulty === "moderate" ? "selected" : ""}>Moderate</option><option value="advanced" ${preferences.difficulty === "advanced" ? "selected" : ""}>Advanced</option></select></label><div class="form-grid"><label class="field"><span>Max prep minutes</span><input class="input" name="max_prep_minutes" type="number" min="1" max="1440" value="${escapeHtml(preferences.max_prep_minutes ?? "")}" /></label><label class="field"><span>Max total minutes</span><input class="input" name="max_total_minutes" type="number" min="1" max="1440" value="${escapeHtml(preferences.max_total_minutes ?? "")}" /></label><label class="field"><span>Usual servings</span><input class="input" name="servings" type="number" min="0.25" max="50" step="0.25" value="${escapeHtml(preferences.servings)}" /></label><label class="field"><span>Repeat window days</span><input class="input" name="repeat_window_days" type="number" min="0" max="365" value="${escapeHtml(preferences.repeat_window_days)}" /></label></div><label class="check-row"><input type="checkbox" name="allow_repeats" ${preferences.allow_repeats ? "checked" : ""} /><span>Allow recipe repeats</span></label><button class="button button-primary" type="submit">Save preferences</button></form>`;
}

async function openGuidancePreferences() {
    const data = await api("/api/app/guidance/preferences", {
        keepPrevious: true,
    });
    openDialog(
        "Guidance preferences",
        guidancePreferencesMarkup(data.preferences),
    );
}

function guidedPlanOverride(form) {
    const overrides = {};
    for (const key of ["allergies", "excluded_ingredients", "equipment"]) {
        const enabled = form.querySelector(
            `[data-guided-override="${key}"]`,
        )?.checked;
        if (enabled)
            overrides[key] = csvList(form.elements[`override_${key}`]?.value);
    }
    return overrides;
}

async function openGuidedPlanner() {
    const weekStart = currentWeekStart();
    const weekEnd = shiftDate(weekStart, 6);
    const workspace = await planningData();
    const canPersonal = workspace.permissions?.personal === true;
    const canHousehold = workspace.permissions?.household === true;
    if (!canPersonal && !canHousehold)
        throw new Error("Planning is read-only for this account.");
    const scope = canPersonal ? "personal" : "household";
    const context = await api(
        `/api/app/guidance/context?scope=${scope}&start=${weekStart}&end=${weekEnd}`,
        { keepPrevious: true },
    );
    state.guided.context = context;
    state.guided.workspace = workspace;
    state.guided.scope = scope;
    const recipes = context.saved_recipes || [];
    const currentPlan = context.current_plan || [];
    const recipeOptions = `<option value="">Skip this day</option>${recipes.map((recipe) => `<option value="${escapeHtml(`${recipe.id}|${recipe.recipe_revision_id}`)}">${escapeHtml(recipe.name)}</option>`).join("")}`;
    const scopeSelector = canHousehold
        ? `<label class="field"><span>Plan scope</span><select name="scope"><option value="${canPersonal ? "personal" : "household"}" selected>${canPersonal ? "Personal" : "Household"}</option>${canPersonal ? '<option value="household">Household</option>' : ""}${canPersonal ? "" : '<option value="personal" disabled>Personal unavailable</option>'}</select></label>`
        : `<input type="hidden" name="scope" value="personal" />`;
    const rows = weekDays(weekStart)
        .map(
            (date) =>
                `<div class="meal-card guided-plan-row" data-guided-date="${date}"><div class="meal-card-head"><strong>${escapeHtml(formatDate(date, { weekday: true }))}</strong><label class="field"><span>Saved recipe</span><select class="input" name="recipe_choice">${recipeOptions}</select></label></div><div class="form-grid"><label class="field"><span>Meal slot</span><select class="input" name="meal_slot"><option value="breakfast">Breakfast</option><option value="lunch" selected>Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><label class="field"><span>Servings</span><input class="input" name="servings" type="number" min="0.25" max="50" step="0.25" value="${escapeHtml(context.preferences.servings || 1)}" /></label></div></div>`,
        )
        .join("");
    const existingPlanNote = currentPlan.length
        ? `<p class="tiny spacer-top">Already scheduled: ${currentPlan.map((meal) => `${escapeHtml(meal.planned_date)} ${escapeHtml(meal.meal_slot || "meal")} — ${escapeHtml(meal.recipe_name)}`).join("; ")}. These stay in place unless you choose to replace a matching slot.</p>`
        : "";
    openDialog(
        "Guided weekly plan",
        `<p>Choose saved recipes for any days, or ask the website model for recipe proposals. Every proposal is checked and its nutrition is resolved by Munch before you review it.</p>${existingPlanNote}<div class="auth-actions spacer-top"><button class="button button-secondary button-small" type="button" data-action="guidance-preferences">Edit preferences</button></div><form id="guided-plan-form" class="auth-form" data-start="${weekStart}" data-end="${weekEnd}">${scopeSelector}<div class="spacer-top">${rows}</div><label class="check-row spacer-top"><input type="checkbox" name="replace_existing" /><span>Replace existing meals in the date and meal slots I include</span></label><details class="spacer-top"><summary>Temporary plan overrides</summary><p class="tiny">Enable a field to replace its saved preference for this plan only.</p>${["allergies", "excluded_ingredients", "equipment"].map((key) => `<label class="check-row"><input type="checkbox" data-guided-override="${key}" /><span>Override ${key.replaceAll("_", " ")}</span></label><label class="field"><span>${key.replaceAll("_", " ")}</span><input class="input" name="override_${key}" placeholder="Comma-separated list" /></label>`).join("")}</details><label class="field spacer-top"><span>Optional request for recipe variety</span><textarea class="input" name="request" maxlength="800" rows="2" placeholder="For example, include two vegetarian dinners"></textarea></label><div class="auth-actions"><button class="button button-primary" type="submit">Create saved-recipe draft</button><button class="button button-secondary" type="button" data-action="guided-ai-create">Suggest recipes with AI</button></div>${recipes.length ? "" : `<p class="tiny">No saved recipes yet. Use AI suggestions or create recipes in the Recipe library first.</p>`}</form>`,
    );
}

function selectedGuidedSavedItems(form) {
    return [...form.querySelectorAll(".guided-plan-row")].flatMap((row) => {
        const selection =
            row.querySelector('[name="recipe_choice"]')?.value || "";
        if (!selection) return [];
        const [recipe_id, recipe_revision_id] = selection.split("|");
        return [
            {
                date: row.dataset.guidedDate,
                meal_slot: row.querySelector('[name="meal_slot"]').value,
                servings: Number(row.querySelector('[name="servings"]').value),
                recipe_id,
                recipe_revision_id,
            },
        ];
    });
}

async function createGuidedDraftFromForm(form, mode, candidateItems) {
    const selectedScope =
        form.elements.scope?.value || state.guided.scope || "personal";
    const householdId =
        state.bootstrap?.household?.householdId ||
        state.bootstrap?.household?.id;
    const request = {
        start_date: form.dataset.start,
        end_date: form.dataset.end,
        timezone: state.bootstrap?.profile?.timezone || "UTC",
        scope: selectedScope,
        ...(selectedScope === "household" && householdId
            ? { household_id: householdId }
            : {}),
        mode,
        preferences_override: guidedPlanOverride(form),
        replace_existing: form.elements.replace_existing?.checked === true,
        idempotency_key: crypto.randomUUID(),
        items: candidateItems,
    };
    const result = await api("/api/app/planning/drafts", {
        method: "POST",
        body: JSON.stringify(request),
        keepPrevious: true,
    });
    state.guided.scope = selectedScope;
    dialog.close();
    await renderGuidedDraftReview(result.draft);
}

function savedRecipeChoices(currentId, currentRevision, recipes) {
    const current = `${currentId || ""}|${currentRevision || ""}`;
    return recipes
        .map((recipe) => {
            const value = `${recipe.id}|${recipe.recipe_revision_id}`;
            return `<option value="${escapeHtml(value)}" ${value === current ? "selected" : ""}>${escapeHtml(recipe.name)}</option>`;
        })
        .join("");
}

async function renderGuidedDraftReview(draft) {
    if (
        !state.guided.context ||
        state.guided.context.scope?.type !== draft.scope?.type
    ) {
        const scope =
            draft.scope?.type === "household" ? "household" : "personal";
        const context = await api(
            `/api/app/guidance/context?scope=${scope}&start=${draft.start_date}&end=${draft.end_date}`,
            { keepPrevious: true },
        );
        state.guided.context = context;
        state.guided.scope = scope;
    }
    state.guided.draft = draft;
    const recipes = state.guided.context?.saved_recipes || [];
    const blockers = draft.items.flatMap((item) => item.blockers || []);
    const items = draft.items
        .map((item) => {
            const isGenerated = item.source_type === "generated";
            const sourceControl =
                draft.mode === "mixed"
                    ? `<label class="field"><span>Recipe source</span><select class="input" name="source_type"><option value="saved" ${isGenerated ? "" : "selected"}>Saved recipe</option><option value="generated" ${isGenerated ? "selected" : ""}>Recipe draft</option></select></label>`
                    : `<input type="hidden" name="source_type" value="${isGenerated ? "generated" : "saved"}" />`;
            const nutrition = item.nutrition?.per_serving || {};
            return `<div class="meal-card guided-draft-item" data-guided-item="${item.position}"><input type="hidden" name="date" value="${escapeHtml(item.date)}" /><div class="meal-card-head"><strong>${escapeHtml(formatDate(item.date, { weekday: true }))} · ${escapeHtml(item.meal_slot)}</strong><span>${escapeHtml(item.nutrition_status)}</span></div>${sourceControl}${!isGenerated || draft.mode === "mixed" ? `<label class="field"><span>Saved recipe</span><select class="input" name="recipe_choice"><option value="">Choose a saved recipe</option>${savedRecipeChoices(item.recipe_id, item.recipe_revision_id, recipes)}</select></label>` : ""}<label class="field"><span>${isGenerated ? "Editable recipe proposal (nutrition is calculated separately)" : "Recipe proposal"}</span><textarea class="input" name="generated_recipe" rows="8" ${isGenerated ? "" : "disabled"}>${isGenerated ? escapeHtml(JSON.stringify(item.generated_recipe, null, 2)) : ""}</textarea></label><div class="meal-macros"><span class="macro-chip">${number(nutrition.calories)} kcal/serving</span><span class="macro-chip">P ${number(nutrition.protein_g, 1)}g</span><span class="macro-chip">C ${number(nutrition.carbs_g, 1)}g</span><span class="macro-chip">F ${number(nutrition.fat_g, 1)}g</span></div>${item.blockers?.length ? `<p class="error-text">Blocked: ${item.blockers.map(escapeHtml).join("; ")}</p>` : ""}${item.warnings?.length ? `<ul class="tiny">${item.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("")}</ul>` : ""}</div>`;
        })
        .join("");
    const editForm =
        draft.status === "draft"
            ? `<form id="guided-plan-edit-form" class="auth-form" data-version="${draft.version}">${items}<div class="auth-actions"><button class="button button-secondary" type="submit">Save edits and recheck</button><button class="button button-primary" type="button" data-action="guided-draft-commit" ${blockers.length ? "disabled" : ""}>Confirm plan</button><button class="button button-quiet" type="button" data-action="guided-draft-cancel">Cancel draft</button></div></form>`
            : `<div class="meal-groups">${items}</div><div class="auth-actions spacer-top"><button class="button button-primary" type="button" data-action="guided-groceries">Review groceries separately</button></div><p class="tiny spacer-top">The plan is scheduled. Nothing has been logged as eaten, and no groceries have been added.</p>`;
    openDialog(
        draft.status === "committed" ? "Plan committed" : "Review meal plan",
        `<p>${draft.items.length} meal${draft.items.length === 1 ? "" : "s"} · ${escapeHtml(draft.start_date)} to ${escapeHtml(draft.end_date)}. ${draft.status === "draft" ? "Review every blocker and warning before confirming." : ""}</p>${editForm}`,
    );
}

async function previewGuidedGroceries() {
    const draft = state.guided.draft;
    if (!draft || draft.status !== "committed")
        throw new Error("Commit the plan before reviewing groceries.");
    const preview = await api(
        `/api/app/planning/drafts/${encodeURIComponent(draft.id)}/groceries`,
        { keepPrevious: true },
    );
    state.guided.groceries = preview;
    const suggestions = preview.suggestions || [];
    openDialog(
        "Review grocery suggestions",
        `<p>Select the items to add. This separate step will add only the checked items to your grocery list.</p>${suggestions.length ? `<div class="meal-groups">${suggestions.map((item) => `<label class="meal-card check-row"><input type="checkbox" data-guided-grocery-index="${item.index}" ${item.already_on_list ? "disabled" : "checked"} /><span><strong>${escapeHtml(item.name)}</strong><small>${item.quantity == null ? "Quantity unavailable" : `${number(item.quantity, 2)} ${escapeHtml(item.unit || "")}`} · ${escapeHtml((item.recipes || []).join(", "))}${item.already_on_list ? " · already on list" : ""}</small></span></label>`).join("")}</div>` : `<div class="empty-state"><div><h3>No quantity-based suggestions</h3><p>Ingredients without a known amount need manual entry.</p></div></div>`}<div class="auth-actions spacer-top"><button class="button button-primary" type="button" data-action="guided-grocery-commit" ${suggestions.length ? "" : "disabled"}>Add selected groceries</button></div><p class="tiny">This does not change pantry inventory or mark anything as eaten.</p>`,
    );
}

async function previewMealSwap(button) {
    const preview = await api(
        `/api/app/planning/${encodeURIComponent(button.dataset.id)}/swaps`,
        { keepPrevious: true },
    );
    const candidates = preview.candidates || [];
    const body = candidates.length
        ? `<div class="meal-groups">${candidates.map((item) => `<article class="meal-card"><div class="meal-card-head"><h3>${escapeHtml(item.recipe_name)}</h3><span>${escapeHtml(item.nutrition_status)}</span></div><p>${number(item.calories_per_serving)} kcal/serving (${item.calories_delta_per_serving == null ? "unknown change" : `${number(item.calories_delta_per_serving, 1)} kcal change`}) · Protein ${number(item.protein_g_per_serving, 1)}g (${item.protein_delta_per_serving == null ? "unknown change" : `${number(item.protein_delta_per_serving, 1)}g change`})</p>${item.warnings?.length ? `<p class="tiny">${item.warnings.map(escapeHtml).join("; ")}</p>` : ""}<button class="button button-secondary button-small" type="button" data-action="meal-swap-apply" data-meal-id="${escapeHtml(preview.planned_meal_id)}" data-version="${preview.expected_version}" data-recipe-id="${escapeHtml(item.recipe_id)}" data-revision-id="${escapeHtml(item.recipe_revision_id)}">Apply swap</button></article>`).join("")}</div>`
        : `<div class="empty-state"><div><h3>No suitable saved recipes</h3><p>Save another recipe with nutrition data to see swap choices.</p></div></div>`;
    openDialog(
        `Swap ${escapeHtml(preview.current.recipe_name)}`,
        `<p>Swap choices use the saved recipe library and your recorded preferences. Applying one requires a separate confirmation.</p>${body}`,
    );
}

async function renderGroceries() {
    setLoading("Loading grocery lists…");
    const data = await planningData();
    const lists = (data.groceries || [])
        .map((list) => {
            const editable = Boolean(data.permissions?.[list.scope]);
            const purchasedCount = list.items.filter(
                (item) => item.purchased_at,
            ).length;
            const listAddButton = editable
                ? `<button class="button button-primary button-small" type="button" data-action="add-grocery" data-scope="${list.scope}">Add item</button>`
                : "";
            return `<section class="panel panel-span-6 grocery-list" data-grocery-scope="${list.scope}"><div class="panel-title"><div><h3>${list.scope === "household" ? "Household list" : "Personal list"}</h3><span>${list.scope === "household" && data.permissions?.householdRole ? `${escapeHtml(data.permissions.householdRole)} · ` : ""}${list.items.length} items</span></div><div class="auth-actions">${listAddButton}${editable && purchasedCount ? `<button class="button button-quiet button-small" type="button" data-action="clear-purchased" data-scope="${list.scope}">Clear purchased</button>` : ""}</div></div>${list.items.length ? `<div class="grocery-items">${list.items.map((item) => `<article class="grocery-item-row ${item.purchased_at ? "is-purchased" : ""}" data-grocery-item-id="${escapeHtml(item.grocery_item_id)}" data-quantity="${escapeHtml(item.quantity ?? "")}" data-unit="${escapeHtml(item.unit || "")}" data-note="${escapeHtml(item.note || "")}"><div class="grocery-item-main"><strong>${escapeHtml(item.name)}</strong><small>${item.quantity == null ? "" : `${number(item.quantity, 2)} ${escapeHtml(item.unit || "")}`}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</small><small class="grocery-provenance">${escapeHtml(grocerySourceLabel(item))}</small></div><div class="grocery-item-actions"><label class="grocery-check"><input type="checkbox" data-action="toggle-grocery-purchased" data-id="${escapeHtml(item.grocery_item_id)}" data-version="${escapeHtml(item.version)}" data-scope="${list.scope}" ${item.purchased_at ? "checked" : ""} ${editable ? "" : "disabled"} aria-label="${escapeHtml(item.name)} purchased" /><span>${item.purchased_at ? "Purchased" : "Mark purchased"}</span></label>${editable ? `<button class="button button-secondary button-small" type="button" data-action="edit-grocery" data-id="${escapeHtml(item.grocery_item_id)}" data-version="${escapeHtml(item.version)}" data-scope="${list.scope}">Edit</button><button class="button button-quiet button-small" type="button" data-action="remove-grocery" data-id="${escapeHtml(item.grocery_item_id)}" data-version="${escapeHtml(item.version)}" data-scope="${list.scope}">Remove</button>` : ""}</div></article>`).join("")}</div>` : `<div class="empty-state"><div><h3>The list is empty</h3><p>Add an item manually or ask your AI assistant to record an explicit shopping need.</p></div></div>`}</section>`;
        })
        .join("");
    content.innerHTML = `<div class="page-heading"><div><h2>Groceries</h2><p>Explicit shopping lists only. Munch does not infer pantry inventory.</p></div><div class="auth-actions"><button class="button button-secondary button-small" data-action="shopping-mode">Shopping mode</button></div></div><div class="dashboard-grid">${lists}</div>`;
}

function cookSummaryCard(cook) {
    const photo = cook.latest_photo_url
        ? '<img class="cook-card-photo" src="' +
          escapeHtml(cook.latest_photo_url) +
          '" alt="Saved photo from ' +
          escapeHtml(cook.title) +
          '" loading="lazy" />'
        : '<div class="cook-card-photo cook-card-photo-empty" aria-hidden="true">♨</div>';
    const sourceNote = cook.source_cook_id
        ? " · based on an earlier attempt"
        : "";
    const statusAction =
        cook.status === "active"
            ? '<button class="button button-quiet button-small" type="button" data-action="finish-cook" data-id="' +
              escapeHtml(cook.id) +
              '">Finish</button>'
            : '<button class="button button-quiet button-small" type="button" data-action="reopen-cook" data-id="' +
              escapeHtml(cook.id) +
              '">Reopen</button>';
    const note = cook.notes ? " · " + escapeHtml(cook.notes) : "";
    return `<article class="cook-card" data-cook-id="${escapeHtml(cook.id)}"><div class="cook-card-main">${photo}<div class="cook-card-copy"><div class="cook-card-head"><div><h3>${escapeHtml(cook.title)}</h3><p class="tiny">${escapeHtml(formatDate(cook.cook_date, { year: true }))} · ${escapeHtml(cook.status)}${sourceNote}</p></div><label class="cook-select"><input type="checkbox" data-cook-select="${escapeHtml(cook.id)}" aria-label="Select ${escapeHtml(cook.title)} for comparison" /> Compare</label></div><p class="cook-card-meta">${number(cook.photo_count)} saved photo${Number(cook.photo_count) === 1 ? "" : "s"}${note}</p><div class="auth-actions"><button class="button button-secondary button-small" type="button" data-action="open-cook" data-id="${escapeHtml(cook.id)}">Open cook</button>${statusAction}</div></div></div></article>`;
}

async function renderCooks() {
    setLoading("Loading cook history…");
    const query = state.cookQuery.trim();
    const filters = state.cookFilters;
    const params = new URLSearchParams({
        status: filters.status || "all",
    });
    if (query) params.set("q", query);
    if (filters.dish) params.set("dish", filters.dish);
    if (filters.method) params.set("method", filters.method);
    if (filters.flavor) params.set("flavor", filters.flavor);
    if (filters.dateFrom) params.set("from", filters.dateFrom);
    if (filters.dateTo) params.set("to", filters.dateTo);
    const data = await api("/api/app/cooks?" + params.toString());
    const cooks = data.cooks || [];
    const active = cooks.filter((cook) => cook.status === "active");
    const finished = cooks.filter((cook) => cook.status !== "active");
    const activeMarkup = active.length
        ? '<section class="panel"><div class="panel-title"><div><h3>Active cooks</h3><span>Continue an in-progress session</span></div><span class="source-chip source-saved">Live</span></div><div class="cook-list">' +
          active.map(cookSummaryCard).join("") +
          "</div></section>"
        : "";
    const historyMarkup =
        finished.length || active.length
            ? '<div class="cook-list">' +
              finished.map(cookSummaryCard).join("") +
              "</div>"
            : '<div class="empty-state"><div><h3>No cooks yet</h3><p>Start before cooking, add a photo and message while cooking, or record a past attempt.</p><button class="button button-primary button-small spacer-top" type="button" data-action="new-cook">Start your first cook</button></div></div>';
    content.innerHTML = `<div class="page-heading"><div><h2>Cooks</h2><p>Persistent cooking sessions with photos, timeline, results, and attempts—separate from food logging.</p></div><div class="auth-actions"><button class="button button-primary button-small" type="button" data-action="new-cook">Start cook</button><button class="button button-secondary button-small" type="button" data-action="compare-cooks">Compare selected</button></div></div><section class="panel cook-search-panel"><form id="cook-search-form" class="inline-form"><input class="input" name="query" type="search" value="${escapeHtml(state.cookQuery)}" placeholder="Search wings, notes, updates…" /><input class="input" name="dish" value="${escapeHtml(filters.dish)}" placeholder="Dish" /><input class="input" name="method" value="${escapeHtml(filters.method)}" placeholder="Method" /><input class="input" name="flavor" value="${escapeHtml(filters.flavor)}" placeholder="Flavor / seasoning" /><label class="tiny">From <input name="date_from" type="date" value="${escapeHtml(filters.dateFrom)}" /></label><label class="tiny">To <input name="date_to" type="date" value="${escapeHtml(filters.dateTo)}" /></label><select name="status" aria-label="Cook status"><option value="all" ${filters.status === "all" ? "selected" : ""}>All statuses</option><option value="active" ${filters.status === "active" ? "selected" : ""}>Active</option><option value="finished" ${filters.status === "finished" ? "selected" : ""}>Finished</option></select><button class="button button-secondary button-small" type="submit">Search history</button></form><p class="tiny">Searches cook history directly, including original updates, timeline notes, results, dish labels, seasoning, method, and date.</p></section>${activeMarkup}<section class="panel"><div class="panel-title"><div><h3>${query || filters.dish || filters.method || filters.flavor || filters.dateFrom || filters.dateTo ? "Matching history" : "Recent history"}</h3><span>${cooks.length} cook${cooks.length === 1 ? "" : "s"}</span></div></div>${historyMarkup}</section>`;
}

function cookDishFormMarkup() {
    return `<div class="cook-create-dish" data-cook-dish><div class="panel-title"><h3>Dish</h3><span>Labels and actual ingredients are editable later.</span></div><label class="field"><span>Dish name</span><input name="dish_name" maxlength="200" placeholder="Wings, mac and cheese…" required /></label><div class="meal-composer-grid"><label class="field"><span>Method</span><input name="method" maxlength="500" placeholder="Smoked, grilled…" /></label><label class="field"><span>Flavor</span><input name="flavor" maxlength="500" placeholder="Lemon pepper, spicy…" /></label><label class="field"><span>Cut / ingredient</span><input name="ingredient_or_cut" maxlength="500" placeholder="Bone-in thighs…" /></label><label class="field"><span>Equipment</span><input name="equipment" maxlength="500" placeholder="Pellet smoker…" /></label></div><label class="field"><span>Actual ingredients (optional, one per line)</span><textarea name="actual_ingredients" rows="2" maxlength="6000" placeholder="Chicken wings\nLemon pepper\nOil"></textarea></label></div>`;
}

function openCookCreate() {
    const scopeOptions = state.bootstrap?.capabilities?.householdCookWrite
        ? '<label class="field"><span>Save to</span><select name="scope"><option value="personal">Personal cooks</option><option value="household">Household cooks</option></select></label>'
        : '<input type="hidden" name="scope" value="personal" />';
    openDialog(
        "Start a cook",
        `<form id="cook-create-form" class="auth-form" enctype="multipart/form-data"><p>Create a cook before, during, or after the fact. This does not log a meal or change pantry inventory.</p>${scopeOptions}<label class="field"><span>Cook title</span><input name="title" maxlength="200" placeholder="Smoked lemon pepper wings" required /></label><div class="meal-composer-grid"><label class="field"><span>Date</span><input name="cook_date" type="date" value="${escapeHtml(state.date)}" required /></label><label class="field"><span>Timezone</span><input name="timezone" value="${escapeHtml(state.bootstrap?.profile?.timezone || "UTC")}" maxlength="100" /></label></div><section id="cook-create-dishes" class="cook-create-dishes">${cookDishFormMarkup()}</section><button class="button button-quiet button-small" type="button" data-action="add-cook-dish">Add another dish</button><label class="field"><span>What are you doing?</span><textarea name="message" rows="3" maxlength="20000" placeholder="I’m starting these wings. I heated the grill to 250°F a couple minutes ago."></textarea></label><label class="field"><span>Photos</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple /><small class="tiny">JPEG, PNG, or WebP; up to 8 MB each. Notes are kept if a photo transfer fails.</small></label><button class="button button-primary" type="submit">Create cook</button></form>`,
    );
}

function cookTimelineMarkup(detail) {
    if (!detail.events?.length)
        return '<div class="empty-state"><div><strong>No timeline events yet.</strong><p>Describe what happened in the update box and Munch will append supported events.</p></div></div>';
    const rows = detail.events
        .map(
            (event) =>
                '<article class="cook-event-row"><div><strong>' +
                escapeHtml(String(event.event_type).replaceAll("_", " ")) +
                "</strong><small>" +
                escapeHtml(formatTime(event.event_at, detail.cook.timezone)) +
                " · submitted " +
                escapeHtml(
                    formatTime(event.submitted_at, detail.cook.timezone),
                ) +
                (event.time_precision === "approximate"
                    ? " · approximate"
                    : "") +
                "</small></div><p>" +
                escapeHtml(event.note || event.original_message || "No note") +
                (event.relative_phrase
                    ? ' <span class="tiny">(' +
                      escapeHtml(event.relative_phrase) +
                      ")</span>"
                    : "") +
                (event.setpoint_temperature != null
                    ? " · setpoint " +
                      number(event.setpoint_temperature, 1) +
                      "°" +
                      escapeHtml(event.setpoint_unit || "")
                    : "") +
                (event.ambient_temperature != null
                    ? " · environment " +
                      number(event.ambient_temperature, 1) +
                      "°" +
                      escapeHtml(event.ambient_unit || "")
                    : "") +
                (event.internal_temperature != null
                    ? " · internal " +
                      number(event.internal_temperature, 1) +
                      "°" +
                      escapeHtml(event.internal_unit || "")
                    : "") +
                '</p><button class="button button-quiet button-small" type="button" data-action="edit-cook-event" data-id="' +
                escapeHtml(event.id) +
                '" data-cook-id="' +
                escapeHtml(detail.cook.id) +
                '">Correct</button></article>',
        )
        .join("");
    return '<div class="cook-timeline">' + rows + "</div>";
}

function cookDetailMarkup(detail) {
    const cook = detail.cook;
    const photoMarkup = detail.media?.length
        ? '<div class="cook-gallery">' +
          detail.media
              .map(
                  (photo) =>
                      '<figure><a href="' +
                      escapeHtml(photo.url) +
                      '" target="_blank" rel="noopener noreferrer" aria-label="Open original cook photo"><img src="' +
                      escapeHtml(photo.url) +
                      '" alt="' +
                      escapeHtml(
                          photo.caption || photo.file_name || "Cook photo",
                      ) +
                      '" loading="lazy" /></a><figcaption>' +
                      escapeHtml(photo.file_name || "Saved photo") +
                      "</figcaption></figure>",
              )
              .join("") +
          "</div>"
        : '<p class="tiny">No saved photos yet.</p>';
    const dishes = detail.dishes
        .map(
            (dish) =>
                '<article class="cook-dish"><strong>' +
                escapeHtml(dish.name) +
                "</strong><span>" +
                escapeHtml(
                    [
                        dish.method,
                        dish.flavor,
                        dish.equipment,
                        dish.ingredient_or_cut,
                    ]
                        .filter(Boolean)
                        .join(" · ") || "No labels yet",
                ) +
                "</span>" +
                '<button class="button button-quiet button-small" type="button" data-action="edit-cook-dish" data-id="' +
                escapeHtml(dish.id) +
                '" data-cook-id="' +
                escapeHtml(detail.cook.id) +
                '" data-cook-version="' +
                escapeHtml(detail.cook.version) +
                '">Edit dish</button>' +
                (dish.recipe_id
                    ? "<small>Linked recipe revision " +
                      escapeHtml(dish.recipe_revision_id || "") +
                      '</small><button class="button button-quiet button-small" type="button" data-action="log-cook-dish" data-id="' +
                      escapeHtml(dish.recipe_id) +
                      '" data-revision="' +
                      escapeHtml(dish.recipe_revision_id || "") +
                      '">Log eaten portion</button>'
                    : "") +
                "</article>",
        )
        .join("");
    const outcome =
        (detail.outcomes || []).find((item) => item.dish_id == null) ||
        detail.outcomes?.[0];
    const updateMarkup = detail.updates?.length
        ? '<details class="cook-original"><summary>Original updates (' +
          detail.updates.length +
          ")</summary>" +
          detail.updates
              .map(
                  (update) =>
                      "<p><strong>" +
                      escapeHtml(
                          formatTime(update.submitted_at, cook.timezone),
                      ) +
                      "</strong> · " +
                      escapeHtml(update.source) +
                      " · " +
                      escapeHtml(update.raw_message) +
                      (update.media_status === "failed"
                          ? ' <span class="error-text">Photo needs retry</span>'
                          : "") +
                      "</p>",
              )
              .join("") +
          "</details>"
        : "";
    const lifecycle =
        cook.status === "active"
            ? '<button class="button button-secondary button-small" type="button" data-action="finish-cook" data-id="' +
              escapeHtml(cook.id) +
              '">Finish</button>'
            : '<button class="button button-secondary button-small" type="button" data-action="reopen-cook" data-id="' +
              escapeHtml(cook.id) +
              '">Reopen</button>';
    return `<div class="cook-detail-view"><div class="cook-detail-head"><div><p class="section-kicker">${escapeHtml(cook.status === "active" ? "Active cook" : "Completed cook")}</p><h2>${escapeHtml(cook.title)}</h2><p class="tiny">${escapeHtml(formatDate(cook.cook_date, { year: true }))} · ${escapeHtml(cook.timezone)} · version ${number(cook.version)}</p></div><div class="auth-actions"><button class="button button-secondary button-small" type="button" data-action="edit-cook" data-id="${escapeHtml(cook.id)}">Edit details</button>${lifecycle}<button class="button button-quiet button-small" type="button" data-action="repeat-cook" data-id="${escapeHtml(cook.id)}">Cook again</button><button class="button button-quiet button-small" type="button" data-action="delete-cook" data-id="${escapeHtml(cook.id)}">Delete</button></div></div>${cook.original_message ? '<details class="cook-original"><summary>Original context</summary><p>' + escapeHtml(cook.original_message) + "</p></details>" : ""}<section class="cook-detail-section"><div class="panel-title"><div><h3>Dishes</h3><span>${detail.dishes.length} recorded</span></div></div><div class="cook-dishes">${dishes}</div></section><section class="cook-detail-section"><div class="panel-title"><div><h3>Photos</h3><span>${detail.media.length} saved</span></div></div>${photoMarkup}</section><section class="cook-detail-section"><div class="panel-title"><div><h3>Timeline</h3><span>${detail.events.length} event${detail.events.length === 1 ? "" : "s"}</span></div></div>${cookTimelineMarkup(detail)}</section><section class="cook-detail-section"><div class="panel-title"><div><h3>Record an update</h3><span>One message can add multiple events and photos.</span></div></div><form id="cook-update-form" class="auth-form" data-id="${escapeHtml(cook.id)}" enctype="multipart/form-data"><input type="hidden" name="timezone" value="${escapeHtml(cook.timezone)}" /><label class="field"><span>What happened?</span><textarea name="message" rows="3" maxlength="20000" placeholder="A couple minutes ago I wrapped the wings. Internal temp was 155°F."></textarea></label><label class="field"><span>Add photos</span><input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple /></label><button class="button button-primary" type="submit">Record update</button></form></section><section class="cook-detail-section"><div class="panel-title"><div><h3>Result</h3><span>User observations stay separate from suggestions.</span></div></div><form id="cook-outcome-form" class="auth-form" data-id="${escapeHtml(cook.id)}" data-version="${escapeHtml(outcome?.version || "")}"><label class="field"><span>Feedback</span><textarea name="written_feedback" rows="3" maxlength="20000" placeholder="What did it taste and feel like?">${escapeHtml(outcome?.written_feedback || "")}</textarea></label><div class="meal-composer-grid"><label class="field"><span>Overall assessment (1–5)</span><input name="overall_assessment" type="number" min="1" max="5" step="0.1" value="${escapeHtml(outcome?.overall_assessment || "")}" /></label><label class="field"><span>Characteristics JSON</span><input name="characteristics" value="${escapeHtml(JSON.stringify(outcome?.characteristics || {}))}" placeholder='{"smoke_intensity":"medium"}' /></label></div><label class="field"><span>What worked</span><textarea name="worked" rows="2" maxlength="10000">${escapeHtml(outcome?.worked || "")}</textarea></label><label class="field"><span>What disappointed you</span><textarea name="disappointed" rows="2" maxlength="10000">${escapeHtml(outcome?.disappointed || "")}</textarea></label><label class="field"><span>Change next time</span><textarea name="next_time_notes" rows="2" maxlength="10000">${escapeHtml(outcome?.next_time_notes || "")}</textarea></label><label class="checkbox-row"><input name="is_preferred" type="checkbox" ${outcome?.is_preferred ? "checked" : ""} /> Preferred attempt</label><button class="button button-primary" type="submit">Save result</button></form></section><section class="cook-detail-section"><div class="auth-actions"><button class="button button-secondary button-small" type="button" data-action="cook-recipe-draft" data-id="${escapeHtml(cook.id)}">Save as recipe</button><button class="button button-secondary button-small" type="button" data-action="set-preferred-cook" data-id="${escapeHtml(cook.id)}">Choose preferred attempt</button></div>${updateMarkup}</section></div>`;
}

function openCookDishEditor(dish, cookId, cookVersion) {
    openDialog(
        "Edit cook dish",
        `<form id="cook-dish-edit-form" class="auth-form" data-id="${escapeHtml(dish.id)}" data-cook-id="${escapeHtml(cookId)}" data-cook-version="${escapeHtml(cookVersion)}"><p>Update the actual dish and labels without changing a linked recipe revision.</p><label class="field"><span>Dish name</span><input name="name" maxlength="200" value="${escapeHtml(dish.name)}" required /></label><div class="meal-composer-grid"><label class="field"><span>Method</span><input name="method" maxlength="500" value="${escapeHtml(dish.method || "")}" /></label><label class="field"><span>Flavor</span><input name="flavor" maxlength="500" value="${escapeHtml(dish.flavor || "")}" /></label><label class="field"><span>Cut / ingredient</span><input name="ingredient_or_cut" maxlength="500" value="${escapeHtml(dish.ingredient_or_cut || "")}" /></label><label class="field"><span>Equipment</span><input name="equipment" maxlength="500" value="${escapeHtml(dish.equipment || "")}" /></label></div><label class="field"><span>Dish notes</span><textarea name="notes" rows="3" maxlength="20000">${escapeHtml(dish.notes || "")}</textarea></label><label class="field"><span>Actual ingredients JSON</span><textarea name="actual_ingredients" rows="6" maxlength="20000">${escapeHtml(JSON.stringify(dish.actual_ingredients || [], null, 2))}</textarea></label><button class="button button-primary" type="submit">Save dish</button></form>`,
    );
}

async function openCook(id) {
    const detail = await api("/api/app/cooks/" + encodeURIComponent(id));
    openDialog(detail.cook.title, cookDetailMarkup(detail));
}

function openCookEdit(cook) {
    openDialog(
        "Edit cook details",
        `<form id="cook-edit-form" class="auth-form" data-id="${escapeHtml(cook.id)}" data-version="${escapeHtml(cook.version)}"><label class="field"><span>Title</span><input name="title" maxlength="200" value="${escapeHtml(cook.title)}" required /></label><div class="meal-composer-grid"><label class="field"><span>Date</span><input name="cook_date" type="date" value="${escapeHtml(cook.cook_date)}" required /></label><label class="field"><span>Status</span><select name="status"><option value="active" ${cook.status === "active" ? "selected" : ""}>Active</option><option value="finished" ${cook.status === "finished" ? "selected" : ""}>Finished</option></select></label></div><label class="field"><span>Notes</span><textarea name="notes" rows="4" maxlength="20000">${escapeHtml(cook.notes || "")}</textarea></label><button class="button button-primary" type="submit">Save details</button></form>`,
    );
}

function openCookEventEditor(eventRecord, cookId) {
    const localTime = eventRecord.event_at
        ? new Date(eventRecord.event_at).toISOString().slice(0, 16)
        : "";
    const types = [
        "preparation",
        "preheat",
        "food_on",
        "temperature_change",
        "wrap",
        "sauce",
        "remove",
        "rest",
        "taste",
        "note",
        "custom",
    ];
    openDialog(
        "Correct timeline event",
        `<form id="cook-event-edit-form" class="auth-form" data-id="${escapeHtml(eventRecord.id)}" data-cook-id="${escapeHtml(cookId)}" data-version="${escapeHtml(eventRecord.version)}"><label class="field"><span>Event</span><select name="event_type">${types.map((type) => '<option value="' + type + '" ' + (eventRecord.event_type === type ? "selected" : "") + ">" + type.replaceAll("_", " ") + "</option>").join("")}</select></label><label class="field"><span>Event time (UTC)</span><input name="event_at" type="datetime-local" value="${escapeHtml(localTime)}" required /></label><label class="field"><span>Note</span><textarea name="note" rows="3" maxlength="20000">${escapeHtml(eventRecord.note || eventRecord.original_message || "")}</textarea></label><div class="meal-composer-grid"><label class="field"><span>Setpoint</span><input name="setpoint_temperature" type="number" step="0.1" value="${escapeHtml(eventRecord.setpoint_temperature ?? "")}" /></label><label class="field"><span>Setpoint unit</span><select name="setpoint_unit"><option value="F" ${eventRecord.setpoint_unit === "F" ? "selected" : ""}>°F</option><option value="C" ${eventRecord.setpoint_unit === "C" ? "selected" : ""}>°C</option></select></label><label class="field"><span>Cooking environment</span><input name="ambient_temperature" type="number" step="0.1" value="${escapeHtml(eventRecord.ambient_temperature ?? "")}" /></label><label class="field"><span>Environment unit</span><select name="ambient_unit"><option value="F" ${eventRecord.ambient_unit === "F" ? "selected" : ""}>°F</option><option value="C" ${eventRecord.ambient_unit === "C" ? "selected" : ""}>°C</option></select></label><label class="field"><span>Internal</span><input name="internal_temperature" type="number" step="0.1" value="${escapeHtml(eventRecord.internal_temperature ?? "")}" /></label><label class="field"><span>Internal unit</span><select name="internal_unit"><option value="F" ${eventRecord.internal_unit === "F" ? "selected" : ""}>°F</option><option value="C" ${eventRecord.internal_unit === "C" ? "selected" : ""}>°C</option></select></label></div><button class="button button-primary" type="submit">Save correction</button></form>`,
    );
}

async function openCookRecipeDraft(cookId) {
    const data = await api(
        "/api/app/cooks/" + encodeURIComponent(cookId) + "/recipe-draft",
        { method: "POST", body: JSON.stringify({}), keepPrevious: true },
    );
    const draft = data.draft;
    const recipe = draft.draft;
    openDialog(
        "Review recipe from cook",
        `<form id="cook-recipe-form" class="auth-form" data-cook-id="${escapeHtml(cookId)}" data-dish-id="${escapeHtml(draft.source_dish_id)}"><p>${escapeHtml(draft.review_note)}</p>${draft.missing_fields?.length ? '<p class="notice warning">Still needed: ' + escapeHtml(draft.missing_fields.join(", ")) + "</p>" : ""}<label class="field"><span>Name</span><input name="name" maxlength="200" value="${escapeHtml(recipe.name)}" required /></label><label class="field"><span>Servings</span><input name="servings" type="number" min="0.01" step="0.01" value="${escapeHtml(recipe.servings ?? "")}" required /></label><label class="field"><span>Actual ingredients JSON</span><textarea name="ingredients_json" rows="7" required>${escapeHtml(JSON.stringify(recipe.ingredients || [], null, 2))}</textarea><small class="tiny">Edit this before saving; Munch will resolve nutrition only at save time.</small></label><label class="field"><span>Instructions</span><textarea name="instructions" rows="7" required>${escapeHtml((recipe.instructions || []).join("\n"))}</textarea><small class="tiny">One step per line.</small></label><button class="button button-primary" type="submit">Save reviewed recipe</button></form>`,
    );
}

function openCookComparison(comparison) {
    const cooks = comparison.cooks || [];
    const columns = cooks
        .map((cook, index) => {
            const outcomes = comparison.outcomes?.[index] || [];
            const photos = comparison.photos?.[index] || [];
            const notes =
                outcomes
                    .map(
                        (outcome) =>
                            outcome.written_feedback || outcome.next_time_notes,
                    )
                    .filter(Boolean)
                    .join(" · ") || "No result recorded";
            return (
                '<article class="cook-compare-column"><h3>' +
                escapeHtml(cook.title) +
                '</h3><p class="tiny">' +
                escapeHtml(cook.cook_date) +
                " · " +
                escapeHtml(cook.status) +
                "</p><h4>Timeline</h4><p>" +
                number((comparison.timelines?.[index] || []).length) +
                " events</p><h4>Result</h4><p>" +
                escapeHtml(notes) +
                '</p><h4>Photos</h4><div class="cook-compare-photos">' +
                (photos
                    .map(
                        (photo) =>
                            '<img src="' +
                            escapeHtml(photo.url) +
                            '" alt="Cook photo" loading="lazy" />',
                    )
                    .join("") || '<span class="tiny">None</span>') +
                "</div></article>"
            );
        })
        .join("");
    openDialog(
        "Compare cook attempts",
        '<p class="tiny">Selected attempts remain separate histories. Use the individual result forms to record or change a preferred attempt.</p><div class="cook-comparison">' +
            columns +
            "</div>",
    );
}

function grocerySourceLabel(item) {
    const sources = [];
    if (item.source_recipe_id) sources.push("From recipe");
    if (item.source_planned_meal_id) sources.push("From meal plan");
    if (!sources.length) sources.push("Manual addition");
    if (item.added_by) sources.push(`Added by ${item.added_by}`);
    return sources.join(" · ");
}

function openGroceryAdd(scope) {
    openDialog(
        scope === "household"
            ? "Add household grocery"
            : "Add personal grocery",
        `<form id="grocery-add-form" class="auth-form" data-scope="${escapeHtml(scope)}"><label class="field"><span>Item</span><input name="name" maxlength="300" required placeholder="Onions, oat milk…" /></label><div class="meal-composer-grid"><label class="field"><span>Quantity</span><input name="quantity" type="number" min="0.01" step="0.01" placeholder="Optional" /></label><label class="field"><span>Unit</span><input name="unit" maxlength="80" placeholder="whole, lb, carton…" /></label></div><label class="field"><span>Note</span><textarea name="note" rows="2" maxlength="500" placeholder="Optional preparation or brand note"></textarea></label><button class="button button-primary" type="submit">Add to list</button></form>`,
    );
}

function openGroceryEdit(item, scope) {
    openDialog(
        "Edit grocery item",
        `<form id="grocery-edit-form" class="auth-form" data-id="${escapeHtml(item.grocery_item_id)}" data-version="${escapeHtml(item.version)}" data-scope="${escapeHtml(scope)}"><label class="field"><span>Item</span><input name="name" maxlength="300" required value="${escapeHtml(item.name)}" /></label><div class="meal-composer-grid"><label class="field"><span>Quantity</span><input name="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity ?? "")}" placeholder="Optional" /></label><label class="field"><span>Unit</span><input name="unit" maxlength="80" value="${escapeHtml(item.unit || "")}" placeholder="whole, lb, carton…" /></label></div><label class="field"><span>Note</span><textarea name="note" rows="2" maxlength="500">${escapeHtml(item.note || "")}</textarea></label><button class="button button-primary" type="submit">Save item</button></form>`,
    );
}

function accountContext() {
    return {
        content,
        api,
        state,
        toast,
        setLoading,
        renderRoute,
        navigate,
    };
}

async function renderRoute() {
    state.route = routes[location.pathname] || "today";
    syncAndroidAdPlacement();
    setActiveRoute(state.route);
    try {
        if (!state.bootstrap) {
            state.bootstrap = await api("/api/app/bootstrap");
            state.date = dateInTimezone(
                state.bootstrap.profile?.timezone || "UTC",
            );
        }
        if (isAccountRoute(state.route) && !accountTitles[state.route]) {
            throw new Error("Unknown account route");
        }
        const renderers = {
            today: renderToday,
            log: renderLog,
            insights: renderInsights,
            foods: renderFoods,
            recipes: renderRecipes,
            cooks: renderCooks,
            plan: renderPlan,
            groceries: renderGroceries,
            more: () => renderAccountRoute("more", accountContext()),
            household: () => renderAccountRoute("household", accountContext()),
            settings: () => renderAccountRoute("settings", accountContext()),
            "settings-profile": () =>
                renderAccountRoute("settings-profile", accountContext()),
            "settings-goals": () =>
                renderAccountRoute("settings-goals", accountContext()),
            "settings-billing": () =>
                renderAccountRoute("settings-billing", accountContext()),
            "settings-connections": () =>
                renderAccountRoute("settings-connections", accountContext()),
            "settings-data": () =>
                renderAccountRoute("settings-data", accountContext()),
            "settings-account": () =>
                renderAccountRoute("settings-account", accountContext()),
        };
        await (renderers[state.route] || renderToday)();
        syncAndroidAdPlacement();
        if (state.route === "today" || state.route === "log") {
            const actions = content.querySelector(
                ".page-heading .auth-actions",
            );
            if (actions && !actions.querySelector('[data-action="add-meal"]')) {
                actions.insertAdjacentHTML(
                    "afterbegin",
                    '<button class="button button-primary button-small" data-action="add-meal">Add meal</button><button class="button button-secondary button-small" data-action="log-by-photo">Log by photo</button><button class="button button-secondary button-small" data-action="start-meal-draft">Start draft</button>',
                );
            }
        }
        content.focus({ preventScroll: true });
    } catch (error) {
        errorState(error);
    }
}

function navigate(href) {
    // Pantry has its own server-rendered shell and script bundle.
    if (
        new URL(href, location.origin).pathname.replace(/\/$/, "") ===
        "/app/pantry"
    ) {
        location.href = href;
        return;
    }
    history.pushState({}, "", href);
    renderRoute();
}

function findMeal(id) {
    const card = document.querySelector(`[data-meal-id="${CSS.escape(id)}"]`);
    return card ? card.querySelector("h4")?.textContent || "Meal" : "Meal";
}

function openDialog(title, body, actions = "") {
    dialog.innerHTML = `<div class="auth-card" style="min-width:min(92vw,520px);max-height:85vh;overflow:auto"><div class="panel-title"><h2 style="font-size:1.6rem">${escapeHtml(title)}</h2><button class="button button-quiet button-small" type="button" data-action="close-dialog" aria-label="Close">Close</button></div>${body}${actions}</div>`;
    if (!dialog.open) dialog.showModal();
}

dialog.addEventListener("close", stopRecipeImportProgress);
new MutationObserver(syncAndroidAdPlacement).observe(dialog, {
    attributes: true,
    attributeFilter: ["open"],
});

const webImportFields = [
    { key: "logged_at", label: "Date", required: true },
    { key: "time", label: "Time" },
    { key: "description", label: "Food name" },
    { key: "meal_type", label: "Meal type" },
    { key: "calories", label: "Calories" },
    { key: "protein_g", label: "Protein (g)" },
    { key: "carbs_g", label: "Carbs (g)" },
    { key: "fat_g", label: "Fat (g)" },
    { key: "fiber_g", label: "Fiber (g)" },
    { key: "sugar_g", label: "Total sugar (g)" },
    { key: "alcohol_g", label: "Alcohol (g)", alcoholOnly: true },
    { key: "notes", label: "Notes" },
    { key: "deleted", label: "Deleted flag" },
];

const webImportAliases = {
    logged_at: ["date", "day", "logged_at", "timestamp", "datum"],
    time: ["time", "uhrzeit"],
    description: [
        "food",
        "food_name",
        "description",
        "name",
        "item",
        "lebensmittel",
    ],
    meal_type: ["meal", "meal_type", "type", "group", "mahlzeit"],
    calories: ["calories", "energy_kcal", "energy", "kcal", "kalorien"],
    protein_g: ["protein_g", "protein", "eiweiss"],
    carbs_g: [
        "carbs_g",
        "carbohydrates_g",
        "carbs",
        "carbohydrates",
        "kohlenhydrate",
    ],
    fat_g: ["fat_g", "fat", "total_fat", "fett"],
    fiber_g: [
        "fiber_g",
        "fiber",
        "fibre_g",
        "fibre",
        "dietary_fiber",
        "ballaststoffe",
    ],
    sugar_g: [
        "sugar_g",
        "sugar",
        "sugars",
        "total_sugar",
        "total_sugars",
        "zucker",
    ],
    alcohol_g: [
        "alcohol_g",
        "alcohol",
        "alcohol_ethyl",
        "ethanol",
        "ethanol_g",
        "alkohol",
    ],
    notes: ["note", "notes", "comment", "kommentar"],
    deleted: ["deleted"],
};

function webImportHeader(value) {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function webImportFindColumn(headers, aliases) {
    const normalized = headers.map(webImportHeader);
    const wanted = aliases.map(webImportHeader);
    const exact = wanted.find((alias) => normalized.includes(alias));
    if (exact !== undefined) return normalized.indexOf(exact);
    return normalized.findIndex((header) =>
        wanted.some(
            (alias) =>
                alias.length > 3 &&
                (header.includes(alias) || alias.includes(header)),
        ),
    );
}

function webImportDateFormat(values) {
    let ambiguous = false;
    let detected = "iso";
    for (const raw of values) {
        const value = String(raw ?? "").trim();
        const slash = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(value);
        if (!slash) {
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) detected = "iso";
            continue;
        }
        const first = Number(slash[1]);
        const second = Number(slash[2]);
        if (first > 12 && second <= 12) detected = "dmy";
        else if (second > 12 && first <= 12) detected = "mdy";
        else ambiguous = true;
    }
    return {
        format: detected === "iso" && ambiguous ? "mdy" : detected,
        ambiguous,
    };
}

function webImportToIsoDate(raw, format) {
    const value = String(raw ?? "").trim();
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
    const slash = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/.exec(value);
    let year;
    let month;
    let day;
    if (iso) {
        year = Number(iso[1]);
        month = Number(iso[2]);
        day = Number(iso[3]);
    } else if (slash) {
        const first = Number(slash[1]);
        const second = Number(slash[2]);
        year = Number(slash[3]);
        month = format === "dmy" ? second : first;
        day = format === "dmy" ? first : second;
    } else return null;
    const probe = new Date(Date.UTC(year, month - 1, day));
    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day) ||
        probe.getUTCFullYear() !== year ||
        probe.getUTCMonth() !== month - 1 ||
        probe.getUTCDate() !== day
    ) {
        return null;
    }
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function webImportTime(raw) {
    const value = String(raw ?? "").trim();
    if (!value) return "";
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?$/i.exec(value);
    if (!match) return "";
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3] || 0);
    const meridiem = (match[4] || "").toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    if (hour > 23 || minute > 59 || second > 59) return "";
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

function webImportNumber(raw, decimalSeparator) {
    const value = String(raw ?? "").trim();
    if (
        !value ||
        ["-", "--", "n/a", "na", "null", "none"].includes(value.toLowerCase())
    )
        return undefined;
    const normalized =
        decimalSeparator === ","
            ? value.replace(/\./g, "").replace(",", ".")
            : value.replace(/,/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function webImportDeleted(raw) {
    return ["1", "true", "yes", "deleted"].includes(
        String(raw ?? "")
            .trim()
            .toLowerCase(),
    );
}

function webImportAlcoholEnabled() {
    return state.bootstrap?.profile?.alcohol_tracking_enabled === true;
}

function webImportAutoMap() {
    const headers = webMealImport.table.headers;
    webMealImport.mapping = Object.fromEntries(
        webImportFields.map((field) => [
            field.key,
            webImportFindColumn(headers, webImportAliases[field.key] || []),
        ]),
    );
    const dateColumn = webMealImport.mapping.logged_at;
    const sniffed = webImportDateFormat(
        dateColumn >= 0
            ? webMealImport.table.rows
                  .slice(0, 50)
                  .map((row) => row[dateColumn])
            : [],
    );
    webMealImport.dateFormat = sniffed.format;
    webMealImport.dateAmbiguous = sniffed.ambiguous;
}

function webImportMapped(row, key) {
    const index = webMealImport.mapping[key];
    return index >= 0 ? row[index] : undefined;
}

function webImportBuildRows() {
    const table = webMealImport.table;
    if (!table || webMealImport.mapping.logged_at < 0) {
        webMealImport.warnings = ["Map a date column before continuing."];
        return false;
    }
    const rows = [];
    let skipped = 0;
    for (let index = 0; index < table.rows.length; index++) {
        const source = table.rows[index];
        if (webImportDeleted(webImportMapped(source, "deleted"))) {
            skipped++;
            continue;
        }
        const date = webImportToIsoDate(
            webImportMapped(source, "logged_at"),
            webMealImport.dateFormat,
        );
        if (!date) {
            skipped++;
            continue;
        }
        const separateTime = webImportTime(webImportMapped(source, "time"));
        const embeddedTime = /[T ](\d{1,2}:\d{2}(?::\d{2})?)/.exec(
            String(webImportMapped(source, "logged_at") || ""),
        );
        const time = separateTime || webImportTime(embeddedTime?.[1]);
        const row = {
            source_line: table.sourceLines[index],
            logged_at: time ? `${date}T${time}` : date,
            description: String(
                webImportMapped(source, "description") ||
                    `${webMealImport.sourceApp || "Imported"} meal`,
            ).trim(),
            meal_type:
                String(webImportMapped(source, "meal_type") || "").trim() ||
                undefined,
            calories: webImportNumber(
                webImportMapped(source, "calories"),
                table.decimalSeparator,
            ),
            protein_g: webImportNumber(
                webImportMapped(source, "protein_g"),
                table.decimalSeparator,
            ),
            carbs_g: webImportNumber(
                webImportMapped(source, "carbs_g"),
                table.decimalSeparator,
            ),
            fat_g: webImportNumber(
                webImportMapped(source, "fat_g"),
                table.decimalSeparator,
            ),
            fiber_g: webImportNumber(
                webImportMapped(source, "fiber_g"),
                table.decimalSeparator,
            ),
            sugar_g: webImportNumber(
                webImportMapped(source, "sugar_g"),
                table.decimalSeparator,
            ),
            alcohol_g: webImportAlcoholEnabled()
                ? webImportNumber(
                      webImportMapped(source, "alcohol_g"),
                      table.decimalSeparator,
                  )
                : undefined,
            notes:
                String(webImportMapped(source, "notes") || "").trim() ||
                undefined,
        };
        if (webMealImport.energyUnit === "kj" && row.calories != null) {
            row.calories = Math.round((row.calories / 4.184) * 10) / 10;
        }
        for (const key of Object.keys(row)) {
            if (row[key] === undefined || row[key] === "") delete row[key];
        }
        rows.push(row);
    }
    webMealImport.rows = rows;
    webMealImport.skipped = skipped;
    const mapped = new Set(
        Object.values(webMealImport.mapping).filter((value) => value >= 0),
    );
    webMealImport.unmappedColumns = table.headers.filter(
        (_, index) => !mapped.has(index),
    );
    webMealImport.localDuplicateCount = 0;
    const seen = new Set();
    for (const row of rows) {
        const digest = JSON.stringify([
            row.description,
            row.meal_type,
            row.calories,
            row.protein_g,
            row.carbs_g,
            row.fat_g,
            row.notes,
            row.logged_at,
        ]);
        if (seen.has(digest)) webMealImport.localDuplicateCount++;
        seen.add(digest);
    }
    webMealImport.warnings = [
        ...(table.warnings || []),
        ...(skipped
            ? [
                  `${skipped} row${skipped === 1 ? "" : "s"} will be skipped because the date is unreadable or the source marks it deleted.`,
              ]
            : []),
    ];
    return rows.length > 0;
}

function webImportPayload(rows, dryRun, firstBatch = false) {
    const payload = {
        meals: rows,
        expected_row_count: rows.length,
        dry_run: dryRun,
        on_error: "continue",
        rows_skipped: firstBatch ? webMealImport.skipped : 0,
        source_app: webMealImport.sourceApp || undefined,
        unmapped_columns: webMealImport.unmappedColumns || [],
    };
    if (rows.every((row) => row.calories !== undefined)) {
        payload.expected_total_kcal = rows.reduce(
            (sum, row) => sum + row.calories,
            0,
        );
    }
    return payload;
}

function resetWebMealImport() {
    Object.assign(webMealImport, {
        table: null,
        mapping: {},
        dateFormat: "iso",
        dateAmbiguous: false,
        energyUnit: "kcal",
        sourceApp: "",
        rows: [],
        skipped: 0,
        warnings: [],
        unmappedColumns: [],
        localDuplicateCount: 0,
        preview: null,
        result: null,
        fileName: "",
        busy: false,
    });
}

function webImportOptionList(selected) {
    return `<option value="-1">Not in file</option>${webMealImport.table.headers
        .map(
            (header, index) =>
                `<option value="${index}" ${selected === index ? "selected" : ""}>${escapeHtml(header || `Column ${index + 1}`)}</option>`,
        )
        .join("")}`;
}

function webImportFileView() {
    return `<form id="web-import-file-form" class="auth-form"><p class="tiny">Upload a supported CSV export. Munch parses it for mapping and preview; nothing is saved at this step.</p><label class="field"><span>Meal-history CSV</span><input name="file" type="file" accept=".csv,text/csv,text/plain" required /></label><button class="button button-primary" type="submit">Parse file</button></form>`;
}

function webImportMappingView() {
    const fields = webImportFields
        .filter((field) => !field.alcoholOnly || webImportAlcoholEnabled())
        .map((field) => {
            const selected = webMealImport.mapping[field.key] ?? -1;
            const sample =
                selected >= 0
                    ? webMealImport.table.rows[0]?.[selected] || ""
                    : "";
            return `<label class="field"><span>${escapeHtml(field.label)}${field.required ? " *" : ""}</span><select name="${field.key}">${webImportOptionList(selected)}</select><small class="tiny">${sample ? `Example: ${escapeHtml(sample)}` : "No value detected"}</small></label>`;
        })
        .join("");
    const alcoholNotice =
        !webImportAlcoholEnabled() &&
        webImportFindColumn(
            webMealImport.table.headers,
            webImportAliases.alcohol_g,
        ) >= 0
            ? `<div class="notice"><strong>Alcohol column excluded.</strong> Alcohol tracking is off, so this column will not be imported. Turn it on in Profile & preferences before importing to retain it.</div>`
            : "";
    return `<form id="web-import-map-form" class="auth-form"><p class="tiny"><strong>${escapeHtml(webMealImport.fileName)}</strong> · ${number(webMealImport.table.rows.length)} parsed rows · ${escapeHtml(webMealImport.table.encoding)}</p>${webMealImport.table.warnings.map((warning) => `<div class="notice">${escapeHtml(warning)}</div>`).join("")}${alcoholNotice}${webMealImport.dateAmbiguous ? `<div class="notice"><strong>Confirm date order.</strong> The sample contains dates that could be month/day or day/month.</div>` : ""}<div class="import-native-grid">${fields}</div><div class="import-native-grid"><label class="field"><span>Date format</span><select name="date_format"><option value="iso" ${webMealImport.dateFormat === "iso" ? "selected" : ""}>Year-month-day</option><option value="mdy" ${webMealImport.dateFormat === "mdy" ? "selected" : ""}>Month/day/year</option><option value="dmy" ${webMealImport.dateFormat === "dmy" ? "selected" : ""}>Day/month/year</option></select></label><label class="field"><span>Energy unit</span><select name="energy_unit"><option value="kcal" ${webMealImport.energyUnit === "kcal" ? "selected" : ""}>Calories (kcal)</option><option value="kj" ${webMealImport.energyUnit === "kj" ? "selected" : ""}>Kilojoules (kJ)</option></select></label><label class="field"><span>Source app (optional)</span><input name="source_app" value="${escapeHtml(webMealImport.sourceApp)}" maxlength="120" placeholder="MyFitnessPal, Cronometer…" /></label></div><div class="auth-actions"><button class="button button-primary" type="submit">Preview import</button><button class="button button-quiet" type="button" data-action="restart-web-import">Choose another file</button></div></form>`;
}

function webImportPreviewView() {
    const preview = webMealImport.preview || {};
    const rows = webMealImport.rows.slice(0, 12);
    const totalKcal = webMealImport.rows.reduce(
        (sum, row) => sum + (row.calories || 0),
        0,
    );
    const previewErrors = (preview.results || [])
        .filter((row) => row.error)
        .slice(0, 5);
    const blocked = preview.status === "failed";
    return `<section class="import-native-stack"><p class="tiny"><strong>${escapeHtml(webMealImport.fileName)}</strong> · Review the exact rows and warnings before anything is saved.</p><div class="import-native-stats"><div><strong>${number(webMealImport.rows.length)}</strong><span>ready</span></div><div><strong>${number(totalKcal)}</strong><span>kcal</span></div><div><strong>${number(webMealImport.skipped)}</strong><span>skipped</span></div><div><strong>${number(webMealImport.localDuplicateCount)}</strong><span>duplicate rows</span></div></div>${webMealImport.warnings.map((warning) => `<div class="notice">${escapeHtml(warning)}</div>`).join("")}${(preview.warnings || []).map((warning) => `<div class="notice">${escapeHtml(warning)}</div>`).join("")}${preview.summary ? `<div class="tiny">Canonical validation preview: ${number(preview.summary.would_create || 0)} would be added, ${number(preview.summary.deduplicated || 0)} already logged, ${number(preview.summary.failed || 0)} need attention.</div>` : ""}${previewErrors.map((row) => `<div class="notice warning">Line ${number(row.source_line)}: ${escapeHtml(row.error.message)}</div>`).join("")}${rows.length ? `<div class="import-native-table-wrap"><table class="import-native-table"><thead><tr><th>Date</th><th>Meal</th><th>Food</th><th>kcal</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.logged_at)}</td><td>${escapeHtml(row.meal_type || "—")}</td><td>${escapeHtml(row.description || "Imported meal")}</td><td>${row.calories == null ? "—" : number(row.calories)}</td></tr>`).join("")}</tbody></table></div>` : ""}${webMealImport.rows.length > rows.length ? `<p class="tiny">Showing the first ${number(rows.length)} of ${number(webMealImport.rows.length)} rows.</p>` : ""}<div class="auth-actions"><button class="button button-primary" type="button" data-action="web-import-commit" ${blocked || !webMealImport.rows.length ? "disabled" : ""}>Import ${number(webMealImport.rows.length)} meals</button><button class="button button-quiet" type="button" data-action="web-import-map-back">Back to mapping</button></div>${blocked ? `<div class="notice danger">The canonical validation pass found blocking errors. Go back, correct the mapping, and preview again.</div>` : `<p class="tiny">This confirmation is explicit. The import is idempotent, so retrying the same file will report already logged rows instead of duplicating them.</p>`}</section>`;
}

function webImportProgressView(done, total, label) {
    const percent = total ? Math.round((done / total) * 100) : 0;
    return `<section class="import-native-stack" aria-live="polite"><p class="tiny">${escapeHtml(label)}</p><div class="progress" aria-label="Import progress"><span style="width:${percent}%"></span></div><p class="tiny">Batch ${number(done)} of ${number(total)}</p></section>`;
}

function webImportReportView() {
    const result = webMealImport.result || {};
    const errors = result.rowErrors || [];
    const success = !result.failed && !result.chunkErrors?.length;
    return `<section class="import-native-stack" aria-live="polite"><div class="import-native-stats"><div><strong>${number(result.created)}</strong><span>imported</span></div><div><strong>${number(result.deduplicated)}</strong><span>already logged</span></div><div><strong>${number(result.failed)}</strong><span>failed</span></div><div><strong>${number(webMealImport.skipped)}</strong><span>skipped</span></div></div><h3>${success ? "Meal history imported" : "Import finished with issues"}</h3>${(result.chunkErrors || []).map((error) => `<div class="notice danger">${escapeHtml(error)}</div>`).join("")}${(result.warnings || []).map((warning) => `<div class="notice">${escapeHtml(warning)}</div>`).join("")}${errors
        .slice(0, 8)
        .map(
            (error) =>
                `<div class="notice warning">Line ${number(error.line)}: ${escapeHtml(error.message)}</div>`,
        )
        .join(
            "",
        )}${errors.length > 8 ? `<p class="tiny">${number(errors.length - 8)} more row errors are available by retrying with the corrected rows.</p>` : ""}<div class="auth-actions"><button class="button button-primary" type="button" data-action="close-import-report">Done</button><button class="button button-quiet" type="button" data-action="restart-web-import">Import another file</button></div></section>`;
}

function openWebMealImport() {
    resetWebMealImport();
    openDialog("Import meal history", webImportFileView());
}

async function previewWebMealImport() {
    if (!webImportBuildRows()) {
        openDialog("Map meal history", webImportMappingView());
        return;
    }
    const batch = webMealImport.rows.slice(0, 50);
    webMealImport.preview = await api("/api/app/import", {
        method: "POST",
        body: JSON.stringify(webImportPayload(batch, true, true)),
        keepPrevious: true,
    });
    openDialog("Preview meal history", webImportPreviewView());
}

async function runWebMealImport() {
    if (webMealImport.busy || !webMealImport.rows.length) return;
    webMealImport.busy = true;
    const batches = [];
    for (let index = 0; index < webMealImport.rows.length; index += 50) {
        batches.push(webMealImport.rows.slice(index, index + 50));
    }
    webMealImport.result = {
        created: 0,
        deduplicated: 0,
        failed: 0,
        rowErrors: [],
        chunkErrors: [],
        warnings: [],
    };
    for (let index = 0; index < batches.length; index++) {
        const batch = batches[index];
        openDialog(
            "Importing meal history",
            webImportProgressView(
                index,
                batches.length,
                `Saving rows ${number(batch[0].source_line)}–${number(batch[batch.length - 1].source_line)}…`,
            ),
        );
        try {
            const result = await api("/api/app/import", {
                method: "POST",
                body: JSON.stringify(
                    webImportPayload(batch, false, index === 0),
                ),
                keepPrevious: true,
            });
            webMealImport.result.created += result.summary?.created || 0;
            webMealImport.result.deduplicated +=
                result.summary?.deduplicated || 0;
            webMealImport.result.failed += result.summary?.failed || 0;
            webMealImport.result.warnings.push(...(result.warnings || []));
            if (result.status === "failed" && !(result.results || []).length) {
                webMealImport.result.chunkErrors.push(
                    `Rows ${batch[0].source_line}–${batch[batch.length - 1].source_line}: ${(result.warnings || []).join(" ") || "The batch failed validation."}`,
                );
                webMealImport.result.failed += batch.length;
            }
            for (const row of result.results || []) {
                if (row.error) {
                    webMealImport.result.rowErrors.push({
                        line: row.source_line,
                        message: row.error.message,
                    });
                }
            }
        } catch (error) {
            webMealImport.result.chunkErrors.push(
                `Rows ${batch[0].source_line}–${batch[batch.length - 1].source_line}: ${error.message || "Import failed"}`,
            );
            webMealImport.result.failed += batch.length;
        }
    }
    webMealImport.busy = false;
    openDialog("Import report", webImportReportView());
}

const draftNutrientFields = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "sodium_mg",
    "saturated_fat_g",
    "cholesterol_mg",
    "potassium_mg",
];

function draftDateTimeValue(value) {
    return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function draftNumber(value) {
    if (value === "" || value == null) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function draftNutrientLabel(key) {
    return key
        .replace("_g", " (g)")
        .replace("_mg", " (mg)")
        .replace("saturated_fat", "sat. fat");
}

function draftItemPayloadFromDom(index) {
    const root = document.querySelector(`[data-draft-item-index="${index}"]`);
    const original = mealDraftReview.draft.items[index];
    if (!root || !original)
        throw new Error("Draft item is no longer available");
    const field = (name) => root.querySelector(`[data-draft-field="${name}"]`);
    const nutrientValues = Object.fromEntries(
        draftNutrientFields
            .map((key) => [key, draftNumber(field(key)?.value)])
            .filter(([, value]) => value !== undefined),
    );
    return {
        name: field("name")?.value || original.name,
        quantity: draftNumber(field("quantity")?.value),
        portion_label: field("portion_label")?.value || undefined,
        gram_weight: draftNumber(field("gram_weight")?.value),
        nutrients: nutrientValues,
        source_type: original.source_type,
        provider: original.provider || undefined,
        provider_food_id: original.provider_food_id || undefined,
        provider_revision: original.provider_revision || undefined,
        source_url: original.source_url || undefined,
        source_updated_at: original.source_updated_at || undefined,
        confidence: original.confidence ?? undefined,
        assumptions: original.assumptions || [],
        source_snapshot: original.source_snapshot || {},
    };
}

function draftManualPayloadFromDom(index) {
    const root = document.querySelector(
        `[data-draft-pending-index="${index}"]`,
    );
    if (!root) throw new Error("Manual draft item is no longer available");
    const field = (name) => root.querySelector(`[data-draft-field="${name}"]`);
    const nutrientValues = Object.fromEntries(
        draftNutrientFields
            .map((key) => [key, draftNumber(field(key)?.value)])
            .filter(([, value]) => value !== undefined),
    );
    return {
        name: field("name")?.value || "",
        quantity: draftNumber(field("quantity")?.value),
        portion_label: field("portion_label")?.value || undefined,
        gram_weight: draftNumber(field("gram_weight")?.value),
        nutrients: nutrientValues,
        source_type: "user_supplied",
        assumptions: [],
        source_snapshot: { resolution_layer: "web_manual" },
    };
}

function draftItemEditor(item, index) {
    const nutrientFields = draftNutrientFields
        .map(
            (key) =>
                `<label class="field"><span>${escapeHtml(draftNutrientLabel(key))}</span><input data-draft-field="${key}" type="number" min="0" step="0.1" value="${escapeHtml(item.nutrients?.[key] ?? "")}" /></label>`,
        )
        .join("");
    return `<article class="meal-draft-item meal-composer-item" data-draft-item-index="${index}"><div class="meal-composer-item-head"><div><strong>${escapeHtml(item.name)}</strong><small>${sourceBadge(item.source_type)} ${confidenceBadge(item.confidence)}</small></div><div class="auth-actions"><button class="button button-primary button-small" type="button" data-action="save-draft-item" data-index="${index}">Save item</button><button class="button button-quiet button-small" type="button" data-action="remove-draft-item" data-index="${index}">Remove</button></div></div><div class="meal-composer-grid"><label class="field"><span>Name</span><input data-draft-field="name" value="${escapeHtml(item.name)}" maxlength="500" required /></label><label class="field"><span>Portion</span><input data-draft-field="portion_label" value="${escapeHtml(item.portion_label || "")}" placeholder="1 bowl, 1 slice…" /></label><label class="field"><span>Quantity</span><input data-draft-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity ?? 1)}" /></label><label class="field"><span>Gram weight</span><input data-draft-field="gram_weight" type="number" min="0.01" step="0.1" value="${escapeHtml(item.gram_weight ?? "")}" /></label></div><div class="meal-composer-nutrients">${nutrientFields}</div><details class="food-audit"><summary>Provenance and assumptions</summary><div class="food-audit-body"><div>${sourceBadge(item.source_type)} ${escapeHtml(item.provider || "Source snapshot preserved")}</div>${item.source_url ? `<a href="${escapeHtml(item.source_url)}" target="_blank" rel="noreferrer">View source</a>` : ""}${item.assumptions?.length ? `<div>Assumptions: ${escapeHtml(item.assumptions.join("; "))}</div>` : ""}</div></details></article>`;
}

function draftManualEditor(item, index) {
    const nutrientFields = draftNutrientFields
        .map(
            (key) =>
                `<label class="field"><span>${escapeHtml(draftNutrientLabel(key))}</span><input data-draft-field="${key}" type="number" min="0" step="0.1" value="${escapeHtml(item.nutrients?.[key] ?? "")}" /></label>`,
        )
        .join("");
    return `<article class="meal-draft-item meal-composer-item" data-draft-pending-index="${index}"><div class="meal-composer-item-head"><div><strong>New manual food</strong><small>${sourceBadge("user_supplied")} Enter the nutrition used</small></div><button class="button button-primary button-small" type="button" data-action="save-draft-manual" data-index="${index}">Add item</button></div><div class="meal-composer-grid"><label class="field"><span>Name</span><input data-draft-field="name" value="${escapeHtml(item.name || "")}" maxlength="500" required /></label><label class="field"><span>Portion</span><input data-draft-field="portion_label" value="${escapeHtml(item.portion_label || "")}" placeholder="1 bowl, 1 slice…" /></label><label class="field"><span>Quantity</span><input data-draft-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity ?? 1)}" /></label><label class="field"><span>Gram weight</span><input data-draft-field="gram_weight" type="number" min="0.01" step="0.1" value="${escapeHtml(item.gram_weight ?? "")}" /></label></div><div class="meal-composer-nutrients">${nutrientFields}</div></article>`;
}

function renderMealDraftReview(draft) {
    mealDraftReview.draft = draft;
    const root = document.getElementById("meal-draft-review");
    if (!root) return;
    const openQuestions = draft.questions.filter(
        (question) => question.status === "open",
    );
    const totals = draft.totals || {};
    const editable = [
        "open",
        "awaiting_answers",
        "awaiting_confirmation",
    ].includes(draft.status);
    root.innerHTML = `<div class="meal-draft-review"><div class="panel-title"><div><span class="section-kicker">${escapeHtml(draft.status.replaceAll("_", " "))}</span><h3>${escapeHtml(draft.description || "Meal draft")}</h3></div><span>Version ${draft.version}</span></div><p class="tiny">${draft.expires_at ? `Expires ${escapeHtml(formatTime(draft.expires_at))}` : ""} ${draft.source_mode ? `· Source: ${escapeHtml(draft.source_mode)}` : ""}</p><div class="summary-grid">${metricCard("Calories", totals.calories, " kcal", null, true)}${metricCard("Protein", totals.protein_g, "g", null)}${metricCard("Carbs", totals.carbs_g, "g", null)}${metricCard("Fat", totals.fat_g, "g", null)}</div>${editable ? `<section class="meal-draft-section"><div class="panel-title"><h4>Meal details</h4><button class="button button-primary button-small" type="button" data-action="save-meal-draft">Save details</button></div><div class="meal-composer-grid"><label class="field"><span>Description</span><input data-draft-field="description" value="${escapeHtml(draft.description || "")}" maxlength="2000" /></label><label class="field"><span>Meal type</span><select data-draft-field="meal_type"><option value="breakfast" ${draft.meal_type === "breakfast" ? "selected" : ""}>Breakfast</option><option value="lunch" ${draft.meal_type === "lunch" ? "selected" : ""}>Lunch</option><option value="dinner" ${draft.meal_type === "dinner" ? "selected" : ""}>Dinner</option><option value="snack" ${draft.meal_type === "snack" ? "selected" : ""}>Snack</option></select></label><label class="field"><span>Logged at</span><input data-draft-field="logged_at" type="datetime-local" value="${escapeHtml(draftDateTimeValue(draft.logged_at))}" /></label></div><label class="field"><span>Notes</span><textarea data-draft-field="notes" rows="2" maxlength="4000">${escapeHtml(draft.notes || "")}</textarea></label></section>` : ""}<section class="meal-draft-section"><div class="panel-title"><h4>Foods and provenance</h4><span>${draft.items.length} item${draft.items.length === 1 ? "" : "s"}</span></div>${draft.items.map(draftItemEditor).join("") || `<p class="tiny">No foods are in this draft yet.</p>`}${mealDraftReview.pendingManual.map(draftManualEditor).join("")}</section>${editable ? `<section class="meal-draft-section meal-composer-search"><div class="panel-title"><h4>Add another food</h4><button class="button button-secondary button-small" type="button" data-action="add-draft-manual">Add manual food</button></div><div class="meal-composer-search-row"><input class="input" id="meal-draft-food-search" type="search" placeholder="Search oats, yogurt, chicken…" autocomplete="off" /><input class="input" id="meal-draft-food-barcode" inputmode="numeric" placeholder="Barcode" aria-label="Food barcode" /><button class="button button-secondary" type="button" data-action="lookup-draft-food-barcode">Look up</button></div><div id="meal-draft-food-results" class="meal-food-results"></div></section>` : ""}${openQuestions.length ? `<section class="meal-draft-section"><div class="panel-title"><h4>Questions</h4><span>${openQuestions.length} open</span></div>${openQuestions.map((question) => `<div class="meal-draft-question" data-draft-question-id="${escapeHtml(question.id)}"><strong>${escapeHtml(question.prompt)}</strong><div class="meal-composer-search-row"><input class="input" data-draft-question-answer placeholder="Answer or correction" maxlength="2000" /><button class="button button-secondary button-small" type="button" data-action="answer-meal-draft-question" data-question-id="${escapeHtml(question.id)}">Save answer</button></div></div>`).join("")}<label class="checkbox-row"><input type="checkbox" data-draft-accept-assumptions /> Accept the remaining assumptions as shown</label></section>` : ""}<div class="auth-actions meal-draft-actions">${editable ? `<button class="button button-primary" type="button" data-action="confirm-meal-draft">${openQuestions.length ? "Confirm and accept assumptions" : "Confirm and log meal"}</button><button class="button button-quiet" type="button" data-action="cancel-meal-draft">Abandon draft</button>` : `<p class="tiny">This draft is ${escapeHtml(draft.status)}.</p>`}</div></div>`;
}

function renderDraftFoodResults(data) {
    const root = document.getElementById("meal-draft-food-results");
    if (!root) return;
    mealDraftReview.options.clear();
    const sections = [];
    if (data.candidates?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Verified foods</h4>${data.candidates
                .map((candidate, index) => {
                    const key = `candidate:${index}`;
                    mealDraftReview.options.set(key, {
                        kind: "candidate",
                        candidateId: candidate.candidate_id,
                    });
                    return `<button class="meal-search-result" type="button" data-action="select-draft-food-option" data-key="${key}"><span><strong>${escapeHtml([candidate.brand, candidate.name].filter(Boolean).join(" — ") || candidate.name)}</strong><small>${sourceBadge(candidate.provider)} ${escapeHtml(candidate.default_portion?.label || "Details available after selection")}</small></span><span>${candidate.default_portion?.calories == null ? "" : `${number(candidate.default_portion.calories)} kcal`}</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.savedFoods?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Saved foods</h4>${data.savedFoods
                .map((saved, index) => {
                    const key = `saved:${index}`;
                    mealDraftReview.options.set(key, {
                        kind: "food",
                        candidateId: saved.food?.candidate_id,
                        savedFoodId: saved.id,
                        portionId: saved.defaultPortionId,
                    });
                    return `<button class="meal-search-result" type="button" data-action="select-draft-food-option" data-key="${key}"><span><strong>${escapeHtml(saved.label)}</strong><small>${sourceBadge(saved.food?.provider)} ${escapeHtml(saved.food?.name || "Saved food")}</small></span><span>${number(foodPortion(saved.food, saved.defaultPortionId)?.nutrients?.calories)} kcal</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.recentMealItems?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Recent foods</h4>${data.recentMealItems
                .map((recent, index) => {
                    const key = `recent:${index}`;
                    mealDraftReview.options.set(key, {
                        kind: "recent",
                        recent,
                    });
                    return `<button class="meal-search-result" type="button" data-action="select-draft-food-option" data-key="${key}"><span><strong>${escapeHtml(recent.name)}</strong><small>${sourceBadge("past_meal")} ${escapeHtml(recent.portionLabel || "Portion not recorded")}</small></span><span>${number(recent.nutrients?.calories)} kcal</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    root.innerHTML =
        sections.join("") ||
        `<p class="tiny">No matches yet. Try a food name or add a manual food.</p>`;
}

async function searchDraftFoods(query) {
    const root = document.getElementById("meal-draft-food-results");
    if (!root) return;
    root.innerHTML = `<p class="tiny">Searching verified foods and personal history…</p>`;
    try {
        const data = await api(
            `/api/app/food-search?query=${encodeURIComponent(query)}&limit=8`,
            { keepPrevious: true },
        );
        renderDraftFoodResults(data);
    } catch (error) {
        if (error?.name !== "AbortError") {
            root.innerHTML = `<p class="tiny">${escapeHtml(error.message || "Food search failed")}</p>`;
        }
    }
}

async function selectDraftFoodOption(key) {
    const option = mealDraftReview.options.get(key);
    const draft = mealDraftReview.draft;
    if (!option || !draft) return;
    let item;
    if (option.kind === "candidate" || option.kind === "food") {
        item = {
            candidate_id: option.candidateId,
            saved_food_id: option.savedFoodId,
            portion_id: option.portionId,
            quantity: 1,
        };
    } else {
        item = {
            name: option.recent.name,
            quantity: 1,
            portion_label: option.recent.portionLabel || undefined,
            nutrients: option.recent.nutrients,
            source_type: "past_meal",
            provider: option.recent.provider,
            provider_food_id: option.recent.providerFoodId,
            source_snapshot: {
                resolution_layer: "personal_history",
                meal_id: option.recent.mealId,
                item_id: option.recent.itemId,
            },
        };
    }
    const result = await api(
        `/api/app/meal-drafts/${encodeURIComponent(draft.id)}/items`,
        {
            method: "POST",
            body: JSON.stringify({ expected_version: draft.version, item }),
            keepPrevious: true,
        },
    );
    mealDraftReview.pendingManual = [];
    renderMealDraftReview(result.draft);
    toast("Food added to draft.");
    searchDraftFoods("");
}

async function lookupDraftFoodBarcode() {
    const input = document.getElementById("meal-draft-food-barcode");
    const root = document.getElementById("meal-draft-food-results");
    if (!input || !root || !input.value.trim()) return;
    root.innerHTML = `<p class="tiny">Looking up the package barcode…</p>`;
    const data = await api(
        `/api/app/food-barcode?barcode=${encodeURIComponent(input.value.trim())}`,
        { keepPrevious: true },
    );
    renderDraftFoodResults({ ...data, savedFoods: [], recentMealItems: [] });
}

async function openMealDraft(id) {
    mealDraftReview.draft = null;
    mealDraftReview.options.clear();
    mealDraftReview.pendingManual = [];
    openDialog(
        "Review meal draft",
        `<div id="meal-draft-review"><p class="tiny">Loading draft…</p></div>`,
    );
    const data = await api(`/api/app/meal-drafts/${encodeURIComponent(id)}`, {
        keepPrevious: true,
    });
    renderMealDraftReview(data.draft);
    searchDraftFoods("");
}

const mealPhotoCapture = { idempotencyKey: null };

async function openMealPhotoDialog() {
    mealPhotoCapture.idempotencyKey = `web-meal-photo:${crypto.randomUUID()}`;
    openDialog(
        "Log by photo",
        `<div class="meal-photo-capture">
            <p class="meal-photo-lede">Photograph your meal and Munch will estimate the items and portions into a reviewable draft. Nothing is logged until you confirm the draft, and the photo itself is processed transiently — it is never kept.</p>
            <label class="field"><span>Meal photo</span><input id="meal-photo-file" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" /></label>
            <label class="field"><span>Meal type</span><select id="meal-photo-meal-type"><option value="breakfast">Breakfast</option><option value="lunch" selected>Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label>
            <p class="tiny meal-photo-status" id="meal-photo-status" role="alert"></p>
            <div class="auth-actions">
                <button class="button button-primary" type="button" data-action="submit-meal-photo" id="meal-photo-submit">Estimate my meal</button>
                <button class="button button-secondary" type="button" data-action="meal-photo-manual">Log manually instead</button>
            </div>
        </div>`,
    );
}

async function submitMealPhoto() {
    const status = document.getElementById("meal-photo-status");
    const submit = document.getElementById("meal-photo-submit");
    const input = document.getElementById("meal-photo-file");
    const file = input?.files?.[0];
    const say = (message) => {
        if (status) status.textContent = message;
    };
    if (!file) return say("Choose a meal photo first.");
    if (file.size > 8 * 1024 * 1024) {
        return say("That photo is over the 8 MB limit — choose a smaller one.");
    }
    const form = new FormData();
    form.append("file", file);
    form.append(
        "meal_type",
        document.getElementById("meal-photo-meal-type")?.value || "lunch",
    );
    form.append("logged_at", `${state.date}T12:00:00.000Z`);
    if (mealPhotoCapture.idempotencyKey) {
        form.append("idempotency_key", mealPhotoCapture.idempotencyKey);
    }
    if (submit) submit.disabled = true;
    say("Estimating items and portions…");
    try {
        const result = await api("/api/app/meal-photo", {
            method: "POST",
            body: form,
        });
        await openMealDraft(result.draft.id);
    } catch (error) {
        if (submit) submit.disabled = false;
        say(error.message || "The photo estimate failed. Nothing was logged.");
    }
}

function foodTitle(food) {
    return [food.brand, food.name].filter(Boolean).join(" — ") || "Food";
}

function foodPortion(food, portionId) {
    return (
        food.portions?.find((portion) => portion.id === portionId) ||
        food.portions?.[0] ||
        null
    );
}

function foodMacroLine(food, portionId) {
    const portion = foodPortion(food, portionId);
    if (!portion) return "No declared portion";
    const nutrients = portion.nutrients || {};
    return `${escapeHtml(portion.label)} · ${number(nutrients.calories)} kcal · P ${number(nutrients.protein_g, 1)}g · C ${number(nutrients.carbs_g, 1)}g · F ${number(nutrients.fat_g, 1)}g`;
}

function syncMealComposerFromDom() {
    const root = document.getElementById("meal-selected-items");
    if (!root) return;
    root.querySelectorAll("[data-composer-index]").forEach((row) => {
        const index = Number(row.dataset.composerIndex);
        const item = mealComposer.items[index];
        if (!item) return;
        const field = (name) =>
            row.querySelector(`[data-composer-field="${name}"]`);
        const quantity = Number(field("quantity")?.value || 1);
        item.quantity =
            Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
        if (item.kind === "food") {
            item.portionId = field("portion_id")?.value || item.portionId;
        } else {
            item.name = field("name")?.value || item.name || "";
            item.portionLabel = field("portion_label")?.value || "";
            item.nutrients = Object.fromEntries(
                [
                    "calories",
                    "protein_g",
                    "carbs_g",
                    "fat_g",
                    "fiber_g",
                    "sugar_g",
                    "alcohol_g",
                    "sodium_mg",
                ].map((key) => [
                    key,
                    field(key)?.value === "" || field(key)?.value == null
                        ? undefined
                        : Number(field(key).value),
                ]),
            );
        }
    });
}

function renderMealComposerItems() {
    const root = document.getElementById("meal-selected-items");
    if (!root) return;
    if (mealComposer.items.length === 0) {
        root.innerHTML = `<div class="empty-state"><div><strong>No foods selected yet.</strong><p>Search for a food, choose a recent item, or add a manual food.</p></div></div>`;
        return;
    }
    root.innerHTML = mealComposer.items
        .map((item, index) => {
            if (item.kind === "food") {
                const portions = item.food.portions || [];
                return `<article class="meal-composer-item" data-composer-index="${index}"><div class="meal-composer-item-head"><div><strong>${escapeHtml(foodTitle(item.food))}</strong><small>${sourceBadge(item.savedFoodId ? "saved_food" : item.food.provider)} ${confidenceBadge(item.food.confidence)}</small></div><button class="button button-quiet button-small" type="button" data-action="remove-meal-item" data-index="${index}">Remove</button></div><div class="meal-composer-grid"><label class="field"><span>Portion</span><select data-composer-field="portion_id">${portions.map((portion) => `<option value="${escapeHtml(portion.id)}" ${portion.id === item.portionId ? "selected" : ""}>${escapeHtml(portion.label)}</option>`).join("")}</select></label><label class="field"><span>Quantity</span><input data-composer-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity || 1)}" /></label></div><small class="meal-composer-macros">${foodMacroLine(item.food, item.portionId)}</small></article>`;
            }
            const nutrients = item.nutrients || {};
            return `<article class="meal-composer-item" data-composer-index="${index}"><div class="meal-composer-item-head"><div><strong>${item.kind === "recent" ? escapeHtml(item.name) : "Manual food"}</strong><small>${sourceBadge(item.sourceType || "user_supplied")} ${item.kind === "recent" ? "From recent meal history" : "Enter the nutrition used"}</small></div><button class="button button-quiet button-small" type="button" data-action="remove-meal-item" data-index="${index}">Remove</button></div><div class="meal-composer-grid"><label class="field"><span>Name</span><input data-composer-field="name" value="${escapeHtml(item.name || "")}" required /></label><label class="field"><span>Portion</span><input data-composer-field="portion_label" value="${escapeHtml(item.portionLabel || "")}" placeholder="1 bowl, 1 slice…" /></label><label class="field"><span>Quantity</span><input data-composer-field="quantity" type="number" min="0.01" step="0.01" value="${escapeHtml(item.quantity || 1)}" /></label></div><div class="meal-composer-nutrients">${["calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "sugar_g", "sodium_mg"].map((key) => `<label class="field"><span>${escapeHtml(key.replaceAll("_g", " (g)").replace("sodium_mg", "sodium (mg)"))}</span><input data-composer-field="${key}" type="number" min="0" step="0.1" value="${escapeHtml(nutrients[key] ?? "")}" /></label>`).join("")}</div></article>`;
        })
        .join("");
}

function renderMealSearchResults(data) {
    const root = document.getElementById("meal-food-results");
    if (!root) return;
    mealComposer.options.clear();
    const sections = [];
    if (data.candidates?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Verified foods</h4>${data.candidates
                .map((candidate, index) => {
                    const key = `candidate:${index}`;
                    mealComposer.options.set(key, {
                        kind: "candidate",
                        candidateId: candidate.candidate_id,
                    });
                    const portion = candidate.default_portion;
                    return `<button class="meal-search-result" type="button" data-action="select-meal-option" data-key="${key}"><span><strong>${escapeHtml([candidate.brand, candidate.name].filter(Boolean).join(" — ") || candidate.name)}</strong><small>${sourceBadge(candidate.provider)} ${escapeHtml(portion?.label || "Details available after selection")}</small></span><span>${portion?.calories == null ? "" : `${number(portion.calories)} kcal`}</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.savedFoods?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Saved foods</h4>${data.savedFoods
                .map((saved, index) => {
                    const key = `saved:${index}`;
                    mealComposer.options.set(key, {
                        kind: "food",
                        food: saved.food,
                        savedFoodId: saved.id,
                        defaultPortionId: saved.defaultPortionId,
                    });
                    return `<button class="meal-search-result" type="button" data-action="select-meal-option" data-key="${key}"><span><strong>${escapeHtml(saved.label)}</strong><small>${sourceBadge(saved.food.provider)} ${escapeHtml(saved.food.name || "Saved food")}</small></span><span>${number(foodPortion(saved.food, saved.defaultPortionId)?.nutrients?.calories)} kcal</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.recentMealItems?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Recent foods</h4>${data.recentMealItems
                .map((recent, index) => {
                    const key = `recent:${index}`;
                    mealComposer.options.set(key, { kind: "recent", recent });
                    return `<button class="meal-search-result" type="button" data-action="select-meal-option" data-key="${key}"><span><strong>${escapeHtml(recent.name)}</strong><small>${sourceBadge("past_meal")} ${escapeHtml(recent.portionLabel || "Portion not recorded")}</small></span><span>${number(recent.nutrients?.calories)} kcal</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    root.innerHTML =
        sections.join("") ||
        `<p class="tiny">No matches yet. Try a food name or add a manual food.</p>`;
}

async function searchMealFoods(query) {
    const root = document.getElementById("meal-food-results");
    if (!root) return;
    root.innerHTML = `<p class="tiny">Searching verified foods and personal history…</p>`;
    try {
        const data = await api(
            `/api/app/food-search?query=${encodeURIComponent(query)}&limit=10`,
            { keepPrevious: true },
        );
        renderMealSearchResults(data);
    } catch (error) {
        if (error?.name !== "AbortError")
            root.innerHTML = `<p class="tiny">${escapeHtml(error.message || "Food search failed")}</p>`;
    }
}

async function selectMealOption(key) {
    syncMealComposerFromDom();
    const option = mealComposer.options.get(key);
    if (!option) return;
    if (option.kind === "candidate") {
        const data = await api(
            `/api/app/food-details?candidate_id=${encodeURIComponent(option.candidateId)}`,
            { keepPrevious: true },
        );
        if (!data.food) throw new Error("Food details are no longer available");
        mealComposer.items.push({
            kind: "food",
            food: data.food,
            candidateId: data.food.candidate_id,
            portionId: data.food.portions?.[0]?.id,
            quantity: 1,
        });
    } else if (option.kind === "food") {
        mealComposer.items.push({
            kind: "food",
            food: option.food,
            candidateId: option.food.candidate_id,
            savedFoodId: option.savedFoodId,
            portionId: option.defaultPortionId || option.food.portions?.[0]?.id,
            quantity: 1,
        });
    } else {
        mealComposer.items.push({
            kind: "recent",
            name: option.recent.name,
            quantity: 1,
            portionLabel: option.recent.portionLabel || "",
            nutrients: option.recent.nutrients,
            sourceType: "past_meal",
            provider: option.recent.provider,
            providerFoodId: option.recent.providerFoodId,
            sourceSnapshot: {
                resolution_layer: "personal_history",
                meal_id: option.recent.mealId,
                item_id: option.recent.itemId,
            },
        });
    }
    renderMealComposerItems();
}

async function lookupMealBarcode() {
    const input = document.getElementById("meal-food-barcode");
    const root = document.getElementById("meal-food-results");
    if (!input || !root) return;
    const barcode = input.value.trim();
    if (!barcode) return;
    root.innerHTML = `<p class="tiny">Looking up the package barcode…</p>`;
    const data = await api(
        `/api/app/food-barcode?barcode=${encodeURIComponent(barcode)}`,
        { keepPrevious: true },
    );
    renderMealSearchResults({
        ...data,
        savedFoods: [],
        recentMealItems: [],
    });
}

function openMealComposer() {
    mealComposer.items = [];
    mealComposer.options.clear();
    openDialog(
        "Add meal",
        `<form id="meal-form" class="auth-form"><input type="hidden" name="logged_at" value="${escapeHtml(`${state.date}T12:00:00.000Z`)}" /><label class="field"><span>Meal name</span><input name="description" value="Meal" maxlength="500" required /></label><label class="field"><span>Meal type</span><select name="meal_type"><option value="breakfast">Breakfast</option><option value="lunch" selected>Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><section class="meal-composer-search"><div class="panel-title"><h3>Find foods</h3><span>Verified, saved, and recent</span></div><div class="meal-composer-search-row"><input class="input" id="meal-food-search" type="search" placeholder="Search oats, yogurt, chicken…" autocomplete="off" /><input class="input" id="meal-food-barcode" inputmode="numeric" placeholder="Barcode" aria-label="Food barcode" /><button class="button button-secondary" type="button" data-action="lookup-food-barcode">Look up</button></div><div id="meal-food-results" class="meal-food-results"></div></section><section><div class="panel-title"><h3>Selected foods</h3><button class="button button-secondary button-small" type="button" data-action="add-manual-food">Add manual food</button></div><div id="meal-selected-items" class="meal-selected-items"></div></section><label class="field"><span>Notes</span><textarea name="notes" rows="2" maxlength="4000" placeholder="Optional"></textarea></label><button class="button button-primary" type="submit">Log meal</button></form>`,
    );
    renderMealComposerItems();
    searchMealFoods("");
}

function openMealDraftComposer() {
    openDialog(
        "Start meal draft",
        `<form id="meal-draft-create-form" class="auth-form"><p class="tiny">Create a reviewable draft when the meal needs clarification or a nutrition check before it is logged.</p><input type="hidden" name="source_mode" value="text" /><input type="hidden" name="logged_at" value="${escapeHtml(`${state.date}T12:00:00.000Z`)}" /><label class="field"><span>What are you logging?</span><input name="description" maxlength="2000" placeholder="Chicken burrito, restaurant dinner…" required /></label><label class="field"><span>Meal type</span><select name="meal_type"><option value="breakfast">Breakfast</option><option value="lunch" selected>Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><label class="field"><span>Notes or context</span><textarea name="notes" rows="3" maxlength="4000" placeholder="Optional details, uncertainty, or corrections"></textarea></label><button class="button button-primary" type="submit">Start reviewable draft</button></form>`,
    );
}

async function editMeal(id) {
    const card = document.querySelector(`[data-meal-id="${CSS.escape(id)}"]`);
    const description = card?.querySelector("h4")?.textContent || "";
    openDialog(
        "Edit meal",
        `<form id="edit-meal-form" class="auth-form" data-id="${escapeHtml(id)}"><label class="field"><span>Description</span><textarea name="description" rows="4" required>${escapeHtml(description)}</textarea></label><label class="field"><span>Meal type</span><select name="meal_type"><option>breakfast</option><option>lunch</option><option>dinner</option><option>snack</option></select></label><button class="button button-primary" type="submit">Save meal</button></form>`,
    );
}

async function openMealDetails(id) {
    const data = await api(`/api/app/meals/${encodeURIComponent(id)}`, {
        keepPrevious: true,
    });
    const meal = data.meal;
    const items = meal.items || [];
    const itemRows = items.length
        ? items
              .map(
                  (item) =>
                      `<article class="food-row"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.portionLabel || "Portion not recorded")}${item.quantity == null ? "" : ` · quantity ${number(item.quantity, 2)}`}</small><div class="demo-source-row">${sourceBadge(item.sourceType)}${confidenceBadge(item.confidence)}</div>${item.assumptions?.length ? `<small>Assumptions: ${escapeHtml(item.assumptions.join("; "))}</small>` : ""}${item.sourceSnapshot && Object.keys(item.sourceSnapshot).length ? `<details class="food-audit"><summary>Source snapshot</summary><pre class="food-audit-body" style="white-space:pre-wrap">${escapeHtml(JSON.stringify(item.sourceSnapshot, null, 2))}</pre></details>` : ""}</div><div style="text-align:right"><strong>${item.nutrients?.calories == null ? "—" : `${number(item.nutrients.calories)} kcal`}</strong><small>${item.nutrients?.protein_g == null ? "" : `P ${number(item.nutrients.protein_g, 1)}g`}${item.nutrients?.carbs_g == null ? "" : ` · C ${number(item.nutrients.carbs_g, 1)}g`}${item.nutrients?.fat_g == null ? "" : ` · F ${number(item.nutrients.fat_g, 1)}g`}</small></div></article>`,
              )
              .join("")
        : `<div class="empty-state"><div><h3>Legacy aggregate meal</h3><p>This meal has totals but no item-level source record.</p></div></div>`;
    openDialog(
        "Meal details",
        `<div class="meal-detail-summary"><h3>${escapeHtml(meal.description || "Untitled meal")}</h3><p>${escapeHtml(formatTime(meal.loggedAt))} · ${escapeHtml(meal.mealType || "snack")}${meal.notes ? ` · ${escapeHtml(meal.notes)}` : ""}</p><div class="meal-macros"><span class="macro-chip">${number(meal.calories)} kcal</span><span class="macro-chip">Protein ${number(meal.proteinG, 1)}g</span><span class="macro-chip">Carbs ${number(meal.carbsG, 1)}g</span><span class="macro-chip">Fat ${number(meal.fatG, 1)}g</span></div></div><section class="food-items spacer-top">${itemRows}</section><div class="auth-actions spacer-top"><button class="button button-secondary button-small" type="button" data-action="edit-meal" data-id="${escapeHtml(id)}">Edit meal</button></div>`,
    );
}

function findWaterEntry(id) {
    return state.waterEntries.find((entry) => entry.id === id) || null;
}

function findWeightEntry(id) {
    return state.weightEntries.find((entry) => entry.id === id) || null;
}

function openWaterEditor(id) {
    const entry = findWaterEntry(id);
    if (!entry) throw new Error("Water entry is no longer visible");
    const amount = entry.amount_ml ?? entry.amountMl;
    const loggedAt = entry.logged_at ?? entry.loggedAt;
    openDialog(
        "Edit water",
        `<form id="edit-water-form" class="auth-form" data-id="${escapeHtml(id)}"><label class="field"><span>Amount (milliliters)</span><input name="amount_ml" type="number" min="1" max="20000" value="${escapeHtml(amount)}" required /></label><label class="field"><span>Notes</span><textarea name="notes" rows="2" maxlength="4000" placeholder="Optional">${escapeHtml(entry.notes || "")}</textarea></label><p class="tiny">Logged ${escapeHtml(formatTime(loggedAt))}${entry.loggedOn ? ` · ${escapeHtml(formatDate(entry.loggedOn, { year: true }))}` : ""}.</p><button class="button button-primary" type="submit">Save water</button></form>`,
    );
}

function openWeightEditor(id) {
    const entry = findWeightEntry(id);
    if (!entry) throw new Error("Weight entry is no longer visible");
    const fallbackUnit = displayWeightUnit(
        state.bootstrap?.profile?.preferred_weight_unit,
    );
    const unit = entry.unit || fallbackUnit;
    const value =
        entry.value ??
        (entry.weight_g == null ? null : weightFromGrams(entry.weight_g, unit));
    const loggedAt = entry.logged_at ?? entry.loggedAt;
    openDialog(
        "Edit weight",
        `<form id="edit-weight-form" class="auth-form" data-id="${escapeHtml(id)}"><label class="field"><span>Weight</span><input name="weight" type="number" min="1" step="0.1" value="${escapeHtml(value)}" required /></label><label class="field"><span>Unit</span><select name="unit" required><option value="lb" ${unit === "lb" ? "selected" : ""}>lb</option><option value="kg" ${unit === "kg" ? "selected" : ""}>kg</option></select></label><label class="field"><span>Notes</span><textarea name="notes" rows="2" maxlength="4000" placeholder="Optional">${escapeHtml(entry.notes || "")}</textarea></label><p class="tiny">Logged ${escapeHtml(formatTime(loggedAt))}${entry.loggedOn ? ` · ${escapeHtml(formatDate(entry.loggedOn, { year: true }))}` : ""}.</p><button class="button button-primary" type="submit">Save weight</button></form>`,
    );
}

async function handleAction(button) {
    const action = button.dataset.action;
    if (!action) return;
    if (await handleAccountAction(button, accountContext())) return;
    if (action === "close-dialog") {
        dialog.close();
        return;
    }
    if (action === "guided-planner") return openGuidedPlanner();
    if (action === "guidance-preferences") return openGuidancePreferences();
    if (action === "confirm-goal-change") {
        const preview = state.goalPreview;
        if (
            !preview ||
            !confirm("Confirm and save these exact target changes?")
        )
            return;
        await api("/api/app/guidance/goals/commit", {
            method: "POST",
            body: JSON.stringify({
                proposal_id: preview.id,
                expected_revision: Number(preview.expected_revision),
                idempotency_key: crypto.randomUUID(),
                confirm: true,
            }),
            keepPrevious: true,
        });
        state.goalPreview = null;
        toast("Nutrition targets saved and added to goal history.");
        return renderRoute();
    }
    if (action === "guided-ai-create") {
        const form = document.querySelector("#guided-plan-form");
        if (!form) throw new Error("Plan form is no longer available.");
        const savedItems = selectedGuidedSavedItems(form);
        const slots = [...form.querySelectorAll(".guided-plan-row")]
            .filter(
                (row) => !row.querySelector('[name="recipe_choice"]')?.value,
            )
            .map((row) => ({
                date: row.dataset.guidedDate,
                meal_slot: row.querySelector('[name="meal_slot"]')?.value,
                servings: Number(
                    row.querySelector('[name="servings"]')?.value || 1,
                ),
            }));
        if (!slots.length) {
            toast(
                "Choose at least one empty day for AI recipe proposals.",
                "error",
            );
            return;
        }
        const proposal = await api("/api/app/planning/propose", {
            method: "POST",
            body: JSON.stringify({
                start_date: form.dataset.start,
                end_date: form.dataset.end,
                timezone: state.bootstrap?.profile?.timezone || "UTC",
                scope:
                    form.elements.scope?.value ||
                    state.guided.scope ||
                    "personal",
                ...(form.elements.scope?.value === "household"
                    ? {
                          household_id:
                              state.bootstrap?.household?.householdId ||
                              state.bootstrap?.household?.id,
                      }
                    : {}),
                meal_slots: slots,
                request: form.elements.request?.value || "",
            }),
            keepPrevious: true,
        });
        if (proposal.status !== "proposed") {
            toast(
                proposal.message ||
                    "AI recipe suggestions are unavailable. Continue manually.",
                "error",
            );
            return;
        }
        const candidateItems = [...savedItems, ...proposal.items];
        return createGuidedDraftFromForm(
            form,
            savedItems.length ? "mixed" : "generated_only",
            candidateItems,
        );
    }
    if (action === "guided-draft-commit") {
        const draft = state.guided.draft;
        if (
            !draft ||
            !confirm(
                "Confirm and schedule this plan? It will not be recorded as food eaten.",
            )
        )
            return;
        const result = await api(
            `/api/app/planning/drafts/${encodeURIComponent(draft.id)}/commit`,
            {
                method: "POST",
                body: JSON.stringify({
                    expected_version: draft.version,
                    confirm: true,
                }),
                keepPrevious: true,
            },
        );
        toast("Meal plan scheduled. Grocery review is a separate step.");
        return renderGuidedDraftReview(result.draft);
    }
    if (action === "guided-draft-cancel") {
        const draft = state.guided.draft;
        if (
            !draft ||
            !confirm("Cancel this plan draft? The calendar will not change.")
        )
            return;
        await api(`/api/app/planning/drafts/${encodeURIComponent(draft.id)}`, {
            method: "DELETE",
            body: JSON.stringify({
                expected_version: draft.version,
                confirm: true,
            }),
            keepPrevious: true,
        });
        dialog.close();
        state.guided.draft = null;
        toast("Plan draft cancelled.");
        return;
    }
    if (action === "guided-groceries") return previewGuidedGroceries();
    if (action === "guided-grocery-commit") {
        const draft = state.guided.draft;
        const preview = state.guided.groceries;
        if (!draft || !preview)
            throw new Error("Review grocery suggestions first.");
        const selected = [
            ...document.querySelectorAll("[data-guided-grocery-index]:checked"),
        ].map((input) => Number(input.dataset.guidedGroceryIndex));
        if (!selected.length) {
            toast("Select at least one grocery item.", "error");
            return;
        }
        if (
            !confirm(
                `Add ${selected.length} selected item${selected.length === 1 ? "" : "s"} to the grocery list?`,
            )
        )
            return;
        const result = await api(
            `/api/app/planning/drafts/${encodeURIComponent(draft.id)}/groceries/commit`,
            {
                method: "POST",
                body: JSON.stringify({
                    selected_indices: selected,
                    confirm: true,
                    idempotency_key: crypto.randomUUID(),
                }),
                keepPrevious: true,
            },
        );
        dialog.close();
        toast(
            `${number(result.addedCount)} grocery item${result.addedCount === 1 ? "" : "s"} added.`,
        );
        state.guided.groceries = null;
        return;
    }
    if (action === "meal-swap") return previewMealSwap(button);
    if (action === "meal-swap-apply") {
        if (!confirm("Apply this saved-recipe swap to the planned meal?"))
            return;
        const result = await api(
            `/api/app/planning/${encodeURIComponent(button.dataset.mealId)}/swap`,
            {
                method: "POST",
                body: JSON.stringify({
                    recipe_id: button.dataset.recipeId,
                    recipe_revision_id: button.dataset.revisionId,
                    expected_version: Number(button.dataset.version),
                    confirm: true,
                    idempotency_key: crypto.randomUUID(),
                }),
                keepPrevious: true,
            },
        );
        state.guided.latestSwap = {
            changeId: result.change.id,
            version: result.planned_meal.version,
        };
        toast("Planned recipe swapped.");
        openDialog(
            "Recipe swapped",
            `<p>The planned meal was updated. You can undo this swap if it has not changed again.</p><button class="button button-secondary" type="button" data-action="meal-swap-undo">Undo swap</button>`,
        );
        return;
    }
    if (action === "meal-swap-undo") {
        const swap = state.guided.latestSwap;
        if (!swap || !confirm("Restore the previous recipe?")) return;
        await api(
            `/api/app/planning/swaps/${encodeURIComponent(swap.changeId)}/undo`,
            {
                method: "POST",
                body: JSON.stringify({
                    expected_version: swap.version,
                    confirm: true,
                    idempotency_key: crypto.randomUUID(),
                }),
                keepPrevious: true,
            },
        );
        state.guided.latestSwap = null;
        dialog.close();
        toast("Previous recipe restored.");
        return renderPlan();
    }
    if (action === "manage-saved-foods") {
        await openSavedFoodsManager();
        return;
    }
    if (action === "select-saved-food-candidate") {
        await openSavedFoodCandidate(button.dataset.key);
        return;
    }
    if (action === "delete-saved-food") {
        if (
            !confirm(
                "Remove this saved food? Existing meal history will be preserved.",
            )
        )
            return;
        const result = await api(
            `/api/app/foods/${encodeURIComponent(button.dataset.id)}`,
            {
                method: "DELETE",
                body: "{}",
                keepPrevious: true,
            },
        );
        toast(
            result.deleted
                ? "Saved food removed."
                : "Saved food was already removed.",
        );
        await openSavedFoodsManager();
        return;
    }
    if (action === "open-import") {
        openWebMealImport();
        return;
    }
    if (action === "restart-web-import") {
        openWebMealImport();
        return;
    }
    if (action === "web-import-map-back") {
        if (webMealImport.table) {
            openDialog("Map meal history", webImportMappingView());
        }
        return;
    }
    if (action === "web-import-commit") {
        await runWebMealImport();
        return;
    }
    if (action === "close-import-report") {
        dialog.close();
        await renderRoute();
        return;
    }
    if (action === "refresh") return renderRoute();
    if (action === "date-prev") state.date = shiftDate(state.date, -1);
    if (action === "date-next") state.date = shiftDate(state.date, 1);
    if (action === "date-week-prev") state.date = shiftDate(state.date, -7);
    if (action === "date-week-next") state.date = shiftDate(state.date, 7);
    if (action === "date-today")
        state.date = dateInTimezone(state.bootstrap.profile?.timezone || "UTC");
    if (
        [
            "date-prev",
            "date-next",
            "date-week-prev",
            "date-week-next",
            "date-today",
        ].includes(action)
    )
        return renderRoute();
    if (action === "add-meal") return openMealComposer();
    if (action === "start-meal-draft") return openMealDraftComposer();
    if (action === "log-by-photo") return openMealPhotoDialog();
    if (action === "submit-meal-photo") return submitMealPhoto();
    if (action === "meal-photo-manual") return openMealComposer();
    if (action === "new-cook") return openCookCreate();
    if (action === "add-cook-dish") {
        document
            .getElementById("cook-create-dishes")
            ?.insertAdjacentHTML("beforeend", cookDishFormMarkup());
        return;
    }
    if (action === "open-cook") {
        await openCook(button.dataset.id);
        return;
    }
    if (action === "edit-cook") {
        const detail = await api(
            `/api/app/cooks/${encodeURIComponent(button.dataset.id)}`,
        );
        openCookEdit(detail.cook);
        return;
    }
    if (action === "edit-cook-dish") {
        const detail = await api(
            `/api/app/cooks/${encodeURIComponent(button.dataset.cookId)}`,
        );
        const dish = detail.dishes.find(
            (item) => item.id === button.dataset.id,
        );
        if (!dish) throw new Error("Cook dish is no longer available");
        openCookDishEditor(dish, button.dataset.cookId, detail.cook.version);
        return;
    }
    if (action === "finish-cook" || action === "reopen-cook") {
        const verb = action === "finish-cook" ? "finish" : "reopen";
        await api(
            `/api/app/cooks/${encodeURIComponent(button.dataset.id)}/${verb}`,
            {
                method: "POST",
                body: JSON.stringify({}),
                keepPrevious: true,
            },
        );
        toast(verb === "finish" ? "Cook finished." : "Cook reopened.");
        if (dialog.open) await openCook(button.dataset.id);
        else await renderRoute();
        return;
    }
    if (action === "delete-cook") {
        if (
            !confirm(
                "Delete this cook, its timeline, results, and saved photos? This cannot be undone.",
            )
        )
            return;
        await api(`/api/app/cooks/${encodeURIComponent(button.dataset.id)}`, {
            method: "DELETE",
            body: "{}",
            keepPrevious: true,
        });
        toast("Cook deleted.");
        if (dialog.open) dialog.close();
        await renderRoute();
        return;
    }
    if (action === "repeat-cook") {
        const result = await api(
            `/api/app/cooks/${encodeURIComponent(button.dataset.id)}/repeat`,
            {
                method: "POST",
                body: JSON.stringify({ idempotency_key: crypto.randomUUID() }),
                keepPrevious: true,
            },
        );
        toast("Fresh cook created from the prior attempt.");
        if (dialog.open && result.cook?.cook?.id)
            await openCook(result.cook.cook.id);
        else await renderRoute();
        return;
    }
    if (action === "cook-recipe-draft") {
        await openCookRecipeDraft(button.dataset.id);
        return;
    }
    if (action === "set-preferred-cook") {
        await api(
            `/api/app/cooks/${encodeURIComponent(button.dataset.id)}/preferred`,
            {
                method: "POST",
                body: "{}",
                keepPrevious: true,
            },
        );
        toast("Preferred attempt updated.");
        await openCook(button.dataset.id);
        return;
    }
    if (action === "edit-cook-event") {
        const detail = await api(
            `/api/app/cooks/${encodeURIComponent(button.dataset.cookId)}`,
        );
        const eventRecord = detail.events.find(
            (event) => event.id === button.dataset.id,
        );
        if (!eventRecord) throw new Error("Cook event is no longer available");
        openCookEventEditor(eventRecord, button.dataset.cookId);
        return;
    }
    if (action === "compare-cooks") {
        const ids = [...document.querySelectorAll("[data-cook-select]:checked")]
            .map((input) => input.dataset.cookSelect)
            .filter(Boolean);
        if (ids.length < 2) {
            toast("Select at least two cooks to compare.", "error");
            return;
        }
        const data = await api(
            `/api/app/cooks/compare?ids=${encodeURIComponent(ids.join(","))}`,
            { keepPrevious: true },
        );
        openCookComparison(data.comparison);
        return;
    }
    if (action === "open-meal-draft") {
        await openMealDraft(button.dataset.id);
        return;
    }
    if (action === "select-draft-food-option") {
        await selectDraftFoodOption(button.dataset.key);
        return;
    }
    if (action === "lookup-draft-food-barcode") {
        await lookupDraftFoodBarcode();
        return;
    }
    if (action === "add-draft-manual") {
        mealDraftReview.pendingManual.push({
            name: "",
            quantity: 1,
            portion_label: "",
            nutrients: {},
        });
        renderMealDraftReview(mealDraftReview.draft);
        return;
    }
    if (action === "save-draft-manual") {
        const draft = mealDraftReview.draft;
        if (!draft) return;
        const item = draftManualPayloadFromDom(Number(button.dataset.index));
        const result = await api(
            `/api/app/meal-drafts/${encodeURIComponent(draft.id)}/items`,
            {
                method: "POST",
                body: JSON.stringify({
                    expected_version: draft.version,
                    item,
                }),
                keepPrevious: true,
            },
        );
        mealDraftReview.pendingManual = [];
        renderMealDraftReview(result.draft);
        toast("Manual food added to draft.");
        return;
    }
    if (action === "save-meal-draft") {
        const draft = mealDraftReview.draft;
        if (!draft) return;
        const root = document.getElementById("meal-draft-review");
        const field = (name) =>
            root?.querySelector(`[data-draft-field="${name}"]`);
        const loggedAt = field("logged_at")?.value
            ? new Date(field("logged_at").value).toISOString()
            : null;
        const result = await api(
            `/api/app/meal-drafts/${encodeURIComponent(draft.id)}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    expected_version: draft.version,
                    description: field("description")?.value || null,
                    meal_type: field("meal_type")?.value,
                    logged_at: loggedAt,
                    notes: field("notes")?.value || null,
                }),
                keepPrevious: true,
            },
        );
        renderMealDraftReview(result.draft);
        toast("Draft details saved.");
        return;
    }
    if (action === "save-draft-item") {
        const draft = mealDraftReview.draft;
        if (!draft) return;
        const index = Number(button.dataset.index);
        const item = draftItemPayloadFromDom(index);
        const record = draft.items[index];
        const result = await api(
            `/api/app/meal-drafts/${encodeURIComponent(draft.id)}/items/${encodeURIComponent(record.id)}`,
            {
                method: "PATCH",
                body: JSON.stringify({ expected_version: draft.version, item }),
                keepPrevious: true,
            },
        );
        renderMealDraftReview(result.draft);
        toast("Draft item saved.");
        return;
    }
    if (action === "remove-draft-item") {
        const draft = mealDraftReview.draft;
        if (!draft) return;
        const index = Number(button.dataset.index);
        const record = draft.items[index];
        if (!record || !confirm(`Remove ${record.name} from this draft?`))
            return;
        const result = await api(
            `/api/app/meal-drafts/${encodeURIComponent(draft.id)}/items/${encodeURIComponent(record.id)}`,
            {
                method: "DELETE",
                body: JSON.stringify({ expected_version: draft.version }),
                keepPrevious: true,
            },
        );
        renderMealDraftReview(result.draft);
        toast("Draft item removed.");
        return;
    }
    if (action === "answer-meal-draft-question") {
        const draft = mealDraftReview.draft;
        const question = button.closest("[data-draft-question-id]");
        const answer = question?.querySelector(
            "[data-draft-question-answer]",
        )?.value;
        if (!draft || !answer?.trim()) {
            toast("Enter an answer or correction first.", "error");
            return;
        }
        const result = await api(
            `/api/app/meal-drafts/${encodeURIComponent(draft.id)}/questions/${encodeURIComponent(button.dataset.questionId)}/answer`,
            {
                method: "POST",
                body: JSON.stringify({
                    expected_version: draft.version,
                    answer,
                }),
                keepPrevious: true,
            },
        );
        renderMealDraftReview(result.draft);
        toast("Draft question answered.");
        return;
    }
    if (action === "confirm-meal-draft") {
        const draft = mealDraftReview.draft;
        if (!draft) return;
        const accepted = Boolean(
            document.querySelector("[data-draft-accept-assumptions]")?.checked,
        );
        if (
            draft.questions.some((question) => question.status === "open") &&
            !accepted
        ) {
            toast(
                "Answer the open questions or accept the remaining assumptions.",
                "error",
            );
            return;
        }
        const result = await api(
            `/api/app/meal-drafts/${encodeURIComponent(draft.id)}/confirm`,
            {
                method: "POST",
                body: JSON.stringify({
                    expected_version: draft.version,
                    confirmed: true,
                    accept_remaining_assumptions: accepted,
                }),
                keepPrevious: true,
            },
        );
        dialog.close();
        toast("Meal confirmed and logged.");
        await renderRoute();
        return result;
    }
    if (action === "cancel-meal-draft") {
        const draft = mealDraftReview.draft;
        if (
            !draft ||
            !confirm("Abandon this meal draft? No meal will be logged.")
        )
            return;
        await api(
            `/api/app/meal-drafts/${encodeURIComponent(draft.id)}/cancel`,
            {
                method: "POST",
                body: JSON.stringify({
                    expected_version: draft.version,
                    confirm: true,
                }),
                keepPrevious: true,
            },
        );
        dialog.close();
        toast("Meal draft abandoned.");
        await renderRoute();
        return;
    }
    if (action === "select-meal-option") {
        await selectMealOption(button.dataset.key);
        return;
    }
    if (action === "remove-meal-item") {
        syncMealComposerFromDom();
        mealComposer.items.splice(Number(button.dataset.index), 1);
        renderMealComposerItems();
        return;
    }
    if (action === "add-manual-food") {
        syncMealComposerFromDom();
        mealComposer.items.push({
            kind: "manual",
            name: "",
            quantity: 1,
            portionLabel: "",
            nutrients: {},
            sourceType: "user_supplied",
        });
        renderMealComposerItems();
        return;
    }
    if (action === "lookup-food-barcode") {
        await lookupMealBarcode();
        return;
    }
    if (action === "edit-meal") return editMeal(button.dataset.id);
    if (action === "view-meal-details") {
        await openMealDetails(button.dataset.id);
        return;
    }
    if (action === "meal-history-range") {
        const days = Number(button.dataset.days);
        if (![1, 30, 90, 365].includes(days)) return;
        state.mealHistoryDays = days;
        return renderLog();
    }
    if (action === "clear-meal-search") {
        state.mealHistoryQuery = "";
        return renderLog();
    }
    if (action === "insight-range") {
        const days = Number(button.dataset.days);
        if (![7, 30, 90].includes(days)) return;
        state.insightsDays = days;
        return renderInsights();
    }
    if (action === "create-recipe") return openRecipeCreate();
    if (action === "import-recipe-url") return openRecipeImport();
    if (action === "compose-recipe") return openRecipeCompose();
    if (action === "add-recipe-ingredient") {
        syncRecipeComposerFromDom();
        recipeComposer.ingredients.push({
            name: "",
            quantity: 1,
            unit: "",
            preparation: "",
            optional: false,
            nutrients: {},
            sourceType: "user_supplied",
            sourceSnapshot: { entered_by_user: true },
        });
        renderRecipeIngredients();
        return;
    }
    if (action === "remove-recipe-ingredient") {
        syncRecipeComposerFromDom();
        recipeComposer.ingredients.splice(Number(button.dataset.index), 1);
        renderRecipeIngredients();
        return;
    }
    if (action === "add-recipe-grocery") {
        syncRecipeComposeGroceriesFromDom();
        recipeCompose.groceryItems.push({
            name: "",
            quantity: undefined,
            unit: "",
            note: "",
        });
        renderRecipeComposeGroceries();
        return;
    }
    if (action === "remove-recipe-grocery") {
        syncRecipeComposeGroceriesFromDom();
        recipeCompose.groceryItems.splice(Number(button.dataset.index), 1);
        renderRecipeComposeGroceries();
        return;
    }
    if (action === "select-recipe-food-option") {
        await selectRecipeFoodOption(button.dataset.key);
        return;
    }
    if (action === "view-recipe") return openRecipe(button.dataset.id);
    if (action === "log-recipe")
        return openRecipeLog(button.dataset.id, button.dataset.revision);
    if (action === "log-cook-dish")
        return openRecipeLog(button.dataset.id, button.dataset.revision);
    if (action === "plan-recipe") return openRecipePlan(button.dataset.id);
    if (action === "archive-recipe") {
        if (
            !confirm(
                "Archive this recipe? Historical meal logs will be preserved.",
            )
        )
            return;
        await api(`/api/app/recipes/${encodeURIComponent(button.dataset.id)}`, {
            method: "DELETE",
            body: JSON.stringify({
                expected_version: Number(button.dataset.version),
            }),
            keepPrevious: true,
        });
        if (dialog.open) dialog.close();
        toast("Recipe archived.");
        return renderRoute();
    }
    if (action === "duplicate-meal") {
        toast(
            "Open your AI assistant and ask Munch to log this meal again. The original entry was not changed.",
        );
        return;
    }
    if (action === "delete-meal") {
        const id = button.dataset.id;
        if (!confirm(`Permanently delete ${findMeal(id)}?`)) return;
        await api(`/api/app/meals/${encodeURIComponent(id)}`, {
            method: "DELETE",
            keepPrevious: true,
        });
        toast("Meal deleted.");
        return renderRoute();
    }
    if (action === "edit-water") {
        openWaterEditor(button.dataset.id);
        return;
    }
    if (action === "delete-water") {
        if (!confirm("Permanently delete this water entry?")) return;
        await api(`/api/app/water/${encodeURIComponent(button.dataset.id)}`, {
            method: "DELETE",
            keepPrevious: true,
        });
        if (dialog.open) dialog.close();
        toast("Water entry deleted.");
        return renderRoute();
    }
    if (action === "edit-weight") {
        openWeightEditor(button.dataset.id);
        return;
    }
    if (action === "delete-weight") {
        if (!confirm("Permanently delete this weight entry?")) return;
        await api(`/api/app/weight/${encodeURIComponent(button.dataset.id)}`, {
            method: "DELETE",
            keepPrevious: true,
        });
        if (dialog.open) dialog.close();
        toast("Weight entry deleted.");
        return renderRoute();
    }
    if (action === "add-water") {
        openDialog(
            "Add water",
            `<form id="water-form" class="auth-form"><label class="field"><span>Amount (milliliters)</span><input name="amount_ml" type="number" min="1" max="20000" value="350" required /></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add water</button></form>`,
        );
        return;
    }
    if (action === "add-weight") {
        const preferredWeightUnit = savedWeightUnit(
            state.bootstrap.profile?.preferred_weight_unit,
        );
        openDialog(
            "Add weight",
            `<form id="weight-form" class="auth-form"><label class="field"><span>Weight</span><input name="weight" type="number" min="1" step="0.1" required /></label><label class="field"><span>Unit</span><select name="unit" required><option value="" disabled ${preferredWeightUnit ? "" : "selected"}>Select unit</option><option value="lb" ${preferredWeightUnit === "lb" ? "selected" : ""}>lb</option><option value="kg" ${preferredWeightUnit === "kg" ? "selected" : ""}>kg</option></select></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add weight</button></form>`,
        );
        return;
    }
    if (action === "billing-checkout") {
        const data = await api("/billing/checkout", {
            method: "POST",
            body: JSON.stringify({ returnTo: "/app/settings/billing" }),
            keepPrevious: true,
        });
        location.href = data.url;
        return;
    }
    if (action === "billing-portal") {
        const data = await api("/billing/portal", {
            method: "POST",
            body: "{}",
            keepPrevious: true,
        });
        location.href = data.url;
        return;
    }
    if (action === "logout") {
        await api("/account/logout", {
            method: "POST",
            body: "{}",
            keepPrevious: true,
        });
        location.href = "/";
        return;
    }
    if (action === "add-grocery") {
        return openGroceryAdd(button.dataset.scope);
    }
    if (action === "edit-grocery") {
        const list = document.querySelector(
            `[data-grocery-scope="${CSS.escape(button.dataset.scope)}"]`,
        );
        const item = list?.querySelector(
            `[data-grocery-item-id="${CSS.escape(button.dataset.id)}"]`,
        );
        if (!item) throw new Error("Grocery item is no longer visible");
        openGroceryEdit(
            {
                grocery_item_id: button.dataset.id,
                version: Number(button.dataset.version),
                name: item.querySelector(".grocery-item-main strong")
                    ?.textContent,
                quantity:
                    item.dataset.quantity === ""
                        ? null
                        : Number(item.dataset.quantity),
                unit: item.dataset.unit || null,
                note: item.dataset.note || null,
            },
            button.dataset.scope,
        );
        return;
    }
    if (action === "remove-grocery") {
        if (!confirm("Remove this grocery item from the list?")) return;
        await api(
            `/api/app/groceries/items/${encodeURIComponent(button.dataset.id)}`,
            {
                method: "DELETE",
                body: JSON.stringify({
                    scope: button.dataset.scope,
                    expected_version: Number(button.dataset.version),
                }),
                keepPrevious: true,
            },
        );
        toast("Grocery item removed.");
        return renderRoute();
    }
    if (action === "toggle-grocery-purchased") {
        const purchased = Boolean(button.checked);
        try {
            await api(
                `/api/app/groceries/items/${encodeURIComponent(button.dataset.id)}/purchased`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        scope: button.dataset.scope,
                        purchased,
                        expected_version: Number(button.dataset.version),
                    }),
                    keepPrevious: true,
                },
            );
        } catch (error) {
            button.checked = !purchased;
            throw error;
        }
        toast(purchased ? "Marked purchased." : "Restored to the list.");
        return renderRoute();
    }
    if (action === "clear-purchased") {
        if (!confirm("Remove all purchased items from this list?")) return;
        const result = await api("/api/app/groceries/clear-purchased", {
            method: "POST",
            body: JSON.stringify({ scope: button.dataset.scope }),
            keepPrevious: true,
        });
        toast(
            `${number(result.clearedCount)} purchased item${result.clearedCount === 1 ? "" : "s"} cleared.`,
        );
        return renderRoute();
    }
    if (action === "shopping-mode")
        document.body.classList.toggle("shopping-mode");
}

document.addEventListener("click", async (event) => {
    const link = event.target.closest("a[href^='/app']");
    if (
        link &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        link.target !== "_blank"
    ) {
        event.preventDefault();
        navigate(link.getAttribute("href"));
        return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    try {
        await handleAction(button);
    } catch (error) {
        toast(error.message || "Action failed", "error");
    }
});

document.addEventListener("change", async (event) => {
    const target = event.target;
    if (target?.matches?.('#guided-plan-form select[name="scope"]')) {
        try {
            const form = target.closest("form");
            const context = await api(
                `/api/app/guidance/context?scope=${target.value}&start=${form.dataset.start}&end=${form.dataset.end}`,
                { keepPrevious: true },
            );
            state.guided.context = context;
            state.guided.scope = target.value;
            const options = `<option value="">Skip this day</option>${(context.saved_recipes || []).map((recipe) => `<option value="${escapeHtml(`${recipe.id}|${recipe.recipe_revision_id}`)}">${escapeHtml(recipe.name)}</option>`).join("")}`;
            form.querySelectorAll('[name="recipe_choice"]').forEach(
                (select) => {
                    select.innerHTML = options;
                },
            );
        } catch (error) {
            toast(
                error.message || "That planning scope is unavailable.",
                "error",
            );
        }
    }
    if (target?.matches?.('.guided-draft-item select[name="source_type"]')) {
        const row = target.closest(".guided-draft-item");
        const recipeText = row?.querySelector('[name="generated_recipe"]');
        const savedChoice = row?.querySelector('[name="recipe_choice"]');
        if (recipeText) recipeText.disabled = target.value !== "generated";
        if (savedChoice) savedChoice.disabled = target.value !== "saved";
    }
});

document.addEventListener("input", (event) => {
    if (event.target.id === "meal-food-search") {
        window.clearTimeout(mealComposer.searchTimer);
        mealComposer.searchTimer = window.setTimeout(
            () => searchMealFoods(event.target.value),
            240,
        );
    }
    if (event.target.id === "meal-draft-food-search") {
        window.clearTimeout(mealDraftReview.searchTimer);
        mealDraftReview.searchTimer = window.setTimeout(
            () => searchDraftFoods(event.target.value),
            240,
        );
    }
    if (event.target.id === "recipe-food-search") {
        window.clearTimeout(recipeComposer.searchTimer);
        recipeComposer.searchTimer = window.setTimeout(
            () => searchRecipeFoods(event.target.value),
            240,
        );
    }
    if (event.target.id === "food-filter") {
        const value = event.target.value.toLowerCase();
        document.querySelectorAll("[data-food-label]").forEach((row) => {
            row.hidden = !row.dataset.foodLabel.includes(value);
        });
    }
    if (event.target.id === "recipe-filter") {
        const value = event.target.value.toLowerCase();
        document.querySelectorAll("[data-recipe-name]").forEach((card) => {
            card.hidden = !card.dataset.recipeName.includes(value);
        });
    }
});

function mealComposerPayload() {
    syncMealComposerFromDom();
    return mealComposer.items.map((item) =>
        item.kind === "food"
            ? {
                  candidate_id: item.candidateId,
                  saved_food_id: item.savedFoodId,
                  portion_id: item.portionId,
                  quantity: item.quantity,
              }
            : {
                  name: item.name,
                  quantity: item.quantity,
                  portion_label: item.portionLabel,
                  nutrients: item.nutrients,
                  source_type: item.sourceType || "user_supplied",
                  provider: item.provider,
                  provider_food_id: item.providerFoodId,
                  source_snapshot: item.sourceSnapshot,
              },
    );
}

document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id === "guidance-preferences-form") {
        event.preventDefault();
        try {
            if (!confirm("Save these guidance preferences?")) return;
            const arrayKeys = [
                "allergies",
                "excluded_ingredients",
                "disliked_ingredients",
                "liked_ingredients",
                "cuisines",
                "flavors",
                "equipment",
                "preferred_methods",
                "avoided_methods",
            ];
            const preferences = {
                objective: form.elements.objective.value,
                suggestions_enabled: form.elements.suggestions_enabled.checked,
                ...Object.fromEntries(
                    arrayKeys.map((key) => [
                        key,
                        csvList(form.elements[key].value),
                    ]),
                ),
                difficulty: form.elements.difficulty.value,
                max_prep_minutes:
                    form.elements.max_prep_minutes.value === ""
                        ? null
                        : Number(form.elements.max_prep_minutes.value),
                max_total_minutes:
                    form.elements.max_total_minutes.value === ""
                        ? null
                        : Number(form.elements.max_total_minutes.value),
                servings: Number(form.elements.servings.value),
                allow_repeats: form.elements.allow_repeats.checked,
                repeat_window_days: Number(
                    form.elements.repeat_window_days.value,
                ),
            };
            const result = await api("/api/app/guidance/preferences", {
                method: "PUT",
                body: JSON.stringify({
                    preferences,
                    expected_version: Number(form.dataset.version),
                    confirm: true,
                }),
                keepPrevious: true,
            });
            dialog.close();
            state.guided.context = null;
            toast(
                `Guidance preferences saved (version ${result.preferences.version}).`,
            );
        } catch (error) {
            toast(error.message || "Preferences could not be saved.", "error");
        }
        return;
    }
    if (form.id === "guided-plan-form") {
        event.preventDefault();
        try {
            const items = selectedGuidedSavedItems(form);
            if (!items.length) {
                toast(
                    "Choose at least one saved recipe, or request AI proposals.",
                    "error",
                );
                return;
            }
            await createGuidedDraftFromForm(form, "saved_only", items);
        } catch (error) {
            toast(
                error.message || "The plan draft could not be created.",
                "error",
            );
        }
        return;
    }
    if (form.id === "guided-plan-edit-form") {
        event.preventDefault();
        try {
            const draft = state.guided.draft;
            if (!draft) throw new Error("Plan draft is no longer available.");
            const items = [...form.querySelectorAll(".guided-draft-item")].map(
                (row) => {
                    const position = Number(row.dataset.guidedItem);
                    const existing = draft.items.find(
                        (item) => item.position === position,
                    );
                    if (!existing)
                        throw new Error(
                            "Plan draft item is no longer available.",
                        );
                    const sourceType =
                        row.querySelector('[name="source_type"]')?.value ||
                        (existing.source_type === "generated"
                            ? "generated"
                            : "saved");
                    const common = {
                        date: existing.date,
                        meal_slot: existing.meal_slot,
                        servings: existing.servings,
                        note: existing.note || undefined,
                    };
                    if (sourceType === "generated") {
                        return {
                            ...common,
                            generated_recipe: JSON.parse(
                                row.querySelector('[name="generated_recipe"]')
                                    ?.value || "{}",
                            ),
                        };
                    }
                    const [recipe_id, recipe_revision_id] = String(
                        row.querySelector('[name="recipe_choice"]')?.value ||
                            "",
                    ).split("|");
                    if (!recipe_id || !recipe_revision_id)
                        throw new Error(
                            "Choose a saved recipe for each saved-recipe item.",
                        );
                    return { ...common, recipe_id, recipe_revision_id };
                },
            );
            const updated = await api(
                `/api/app/planning/drafts/${encodeURIComponent(draft.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        expected_version: Number(form.dataset.version),
                        items,
                        preferences_override: draft.preferences_override,
                    }),
                    keepPrevious: true,
                },
            );
            toast("Plan draft rechecked with the shared nutrition resolver.");
            return renderGuidedDraftReview(updated);
        } catch (error) {
            toast(
                error.message || "The plan draft could not be updated.",
                "error",
            );
            return;
        }
    }
    if (
        [
            "settings-profile-form",
            "settings-goals-form",
            "household-create-form",
            "household-invite-form",
        ].includes(form.id)
    ) {
        event.preventDefault();
        try {
            await handleAccountSubmit(form, accountContext());
        } catch (error) {
            toast(error.message || "Save failed", "error");
        }
        return;
    }
    if (form.id === "recipe-import-url-form") {
        event.preventDefault();
        const submit = form.querySelector("button[type='submit']");
        submit.disabled = true;
        submit.setAttribute("aria-busy", "true");
        submit.textContent = "Checking recipe page…";
        startRecipeImportProgress();
        const controller = new AbortController();
        recipeImport.controller = controller;
        try {
            const values = Object.fromEntries(new FormData(form));
            const data = await api("/api/app/recipes/import-preview", {
                method: "POST",
                body: JSON.stringify({ url: String(values.url || "").trim() }),
                keepPrevious: true,
                signal: controller.signal,
            });
            openRecipeImportReview(data.draft);
        } catch (error) {
            if (error?.name === "AbortError") return;
            setRecipeImportProgressError(
                error.message || "Try another public recipe URL.",
            );
            toast(
                error.message || "The recipe URL could not be imported.",
                "error",
            );
        } finally {
            if (recipeImport.controller === controller)
                recipeImport.controller = null;
            if (submit.isConnected) {
                submit.disabled = false;
                submit.removeAttribute("aria-busy");
                submit.textContent = "Check recipe page";
            }
        }
        return;
    }
    if (form.id === "web-import-file-form") {
        event.preventDefault();
        const submit = form.querySelector("button[type='submit']");
        const file = form.elements.file?.files?.[0];
        if (!file) {
            toast("Choose a CSV file first.", "error");
            return;
        }
        submit.disabled = true;
        try {
            const data = await api("/api/app/import/parse", {
                method: "POST",
                body: new FormData(form),
                keepPrevious: true,
            });
            webMealImport.fileName = data.fileName || file.name;
            webMealImport.table = data.table;
            webMealImport.warnings = data.table?.warnings || [];
            webImportAutoMap();
            openDialog("Map meal history", webImportMappingView());
        } catch (error) {
            toast(error.message || "The file could not be parsed.", "error");
        } finally {
            submit.disabled = false;
        }
        return;
    }
    if (form.id === "web-import-map-form") {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form));
        for (const field of webImportFields) {
            const value = values[field.key];
            if (value !== undefined)
                webMealImport.mapping[field.key] = Number(value);
        }
        webMealImport.dateFormat = values.date_format || "iso";
        webMealImport.energyUnit = values.energy_unit || "kcal";
        webMealImport.sourceApp = String(values.source_app || "").trim();
        const submit = form.querySelector("button[type='submit']");
        submit.disabled = true;
        try {
            await previewWebMealImport();
        } catch (error) {
            toast(
                error.message || "The import preview could not be created.",
                "error",
            );
        } finally {
            submit.disabled = false;
        }
        return;
    }
    if (form.id === "meal-history-search-form") {
        event.preventDefault();
        state.mealHistoryQuery = String(
            form.elements.query?.value || "",
        ).trim();
        if (state.mealHistoryQuery) state.mealHistoryDays = 365;
        await renderLog();
        return;
    }
    if (form.id === "cook-search-form") {
        event.preventDefault();
        state.cookQuery = String(form.elements.query?.value || "").trim();
        state.cookFilters = {
            dish: String(form.elements.dish?.value || "").trim(),
            method: String(form.elements.method?.value || "").trim(),
            flavor: String(form.elements.flavor?.value || "").trim(),
            dateFrom: String(form.elements.date_from?.value || "").trim(),
            dateTo: String(form.elements.date_to?.value || "").trim(),
            status: ["all", "active", "finished"].includes(
                form.elements.status?.value,
            )
                ? form.elements.status.value
                : "all",
        };
        await renderCooks();
        return;
    }
    if (form.id === "saved-food-search-form") {
        event.preventDefault();
        try {
            await searchSavedFoodCandidates();
        } catch (error) {
            toast(error.message || "Food search failed", "error");
        }
        return;
    }
    if (
        ![
            "edit-meal-form",
            "meal-form",
            "water-form",
            "weight-form",
            "edit-water-form",
            "edit-weight-form",
            "meal-draft-create-form",
            "preferences-form",
            "goals-form",
            "recipe-create-form",
            "recipe-compose-form",
            "recipe-edit-form",
            "recipe-log-form",
            "recipe-plan-form",
            "grocery-add-form",
            "grocery-edit-form",
            "saved-food-form",
            "cook-create-form",
            "cook-update-form",
            "cook-edit-form",
            "cook-dish-edit-form",
            "cook-event-edit-form",
            "cook-outcome-form",
            "cook-recipe-form",
        ].includes(form.id)
    )
        return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
        if (form.id === "cook-create-form") {
            const formData = new FormData(form);
            const dishes = [...form.querySelectorAll("[data-cook-dish]")].map(
                (dish) => {
                    const value = (name) =>
                        dish.querySelector(`[name="${name}"]`)?.value?.trim() ||
                        "";
                    const actualIngredients = value("actual_ingredients")
                        .split("\n")
                        .map((name) => name.trim())
                        .filter(Boolean)
                        .map((name) => ({ name }));
                    return {
                        name: value("dish_name"),
                        method: value("method") || null,
                        flavor: value("flavor") || null,
                        ingredient_or_cut: value("ingredient_or_cut") || null,
                        equipment: value("equipment") || null,
                        actual_ingredients: actualIngredients,
                    };
                },
            );
            if (dishes.some((dish) => !dish.name)) {
                throw new Error("Every cook dish needs a name");
            }
            formData.set("dishes", JSON.stringify(dishes));
            for (const field of [
                "dish_name",
                "method",
                "flavor",
                "ingredient_or_cut",
                "equipment",
                "actual_ingredients",
            ]) {
                formData.delete(field);
            }
            formData.set("idempotency_key", crypto.randomUUID());
            const result = await api("/api/app/cooks", {
                method: "POST",
                body: formData,
                keepPrevious: true,
            });
            toast(
                result.mediaFailures?.length
                    ? "Cook created; one or more photos need retry."
                    : "Cook created.",
            );
            dialog.close();
            await renderRoute();
            return;
        }
        if (form.id === "cook-update-form") {
            const formData = new FormData(form);
            formData.set("idempotency_key", crypto.randomUUID());
            const result = await api(
                `/api/app/cooks/${encodeURIComponent(form.dataset.id)}/updates`,
                {
                    method: "POST",
                    body: formData,
                    keepPrevious: true,
                },
            );
            toast(
                result.update?.mediaFailures?.length
                    ? "Update saved; one or more photos need retry."
                    : "Cook update recorded.",
            );
            await openCook(form.dataset.id);
            return;
        }
        if (form.id === "cook-edit-form") {
            await api(`/api/app/cooks/${encodeURIComponent(form.dataset.id)}`, {
                method: "PATCH",
                body: JSON.stringify({
                    title: values.title,
                    cook_date: values.cook_date,
                    status: values.status,
                    notes: values.notes || null,
                    expected_version: Number(form.dataset.version),
                }),
                keepPrevious: true,
            });
            toast("Cook details updated.");
            await openCook(form.dataset.id);
            return;
        }
        if (form.id === "cook-dish-edit-form") {
            let actualIngredients = [];
            try {
                actualIngredients = values.actual_ingredients
                    ? JSON.parse(values.actual_ingredients)
                    : [];
            } catch {
                throw new Error("Actual ingredients must be valid JSON");
            }
            if (!Array.isArray(actualIngredients)) {
                throw new Error("Actual ingredients must be an array");
            }
            await api(
                `/api/app/cooks/${encodeURIComponent(form.dataset.cookId)}/dishes/${encodeURIComponent(form.dataset.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        name: values.name,
                        method: values.method || null,
                        flavor: values.flavor || null,
                        ingredient_or_cut: values.ingredient_or_cut || null,
                        equipment: values.equipment || null,
                        notes: values.notes || null,
                        actual_ingredients: actualIngredients,
                        expected_version: Number(form.dataset.cookVersion),
                    }),
                    keepPrevious: true,
                },
            );
            toast("Cook dish updated.");
            await openCook(form.dataset.cookId);
            return;
        }
        if (form.id === "cook-event-edit-form") {
            const eventBody = {
                event_type: values.event_type,
                event_at: new Date(values.event_at + "Z").toISOString(),
                time_precision: "exact",
                note: values.note || null,
                setpoint_temperature:
                    values.setpoint_temperature === ""
                        ? null
                        : Number(values.setpoint_temperature),
                setpoint_unit:
                    values.setpoint_temperature === ""
                        ? null
                        : values.setpoint_unit,
                ambient_temperature:
                    values.ambient_temperature === ""
                        ? null
                        : Number(values.ambient_temperature),
                ambient_unit:
                    values.ambient_temperature === ""
                        ? null
                        : values.ambient_unit,
                internal_temperature:
                    values.internal_temperature === ""
                        ? null
                        : Number(values.internal_temperature),
                internal_unit:
                    values.internal_temperature === ""
                        ? null
                        : values.internal_unit,
            };
            await api(
                `/api/app/cooks/${encodeURIComponent(form.dataset.cookId)}/events/${encodeURIComponent(form.dataset.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        ...eventBody,
                        expected_version: Number(form.dataset.version),
                    }),
                    keepPrevious: true,
                },
            );
            toast("Timeline correction saved.");
            await openCook(form.dataset.cookId);
            return;
        }
        if (form.id === "cook-outcome-form") {
            let characteristics = {};
            try {
                characteristics = values.characteristics
                    ? JSON.parse(values.characteristics)
                    : {};
            } catch {
                throw new Error("Characteristics must be valid JSON");
            }
            await api(
                `/api/app/cooks/${encodeURIComponent(form.dataset.id)}/outcome`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        written_feedback: values.written_feedback || null,
                        overall_assessment:
                            values.overall_assessment === ""
                                ? null
                                : Number(values.overall_assessment),
                        characteristics,
                        worked: values.worked || null,
                        disappointed: values.disappointed || null,
                        next_time_notes: values.next_time_notes || null,
                        is_preferred: form.elements.is_preferred.checked,
                        expected_version: form.dataset.version
                            ? Number(form.dataset.version)
                            : undefined,
                    }),
                    keepPrevious: true,
                },
            );
            toast("Cook result saved.");
            await openCook(form.dataset.id);
            return;
        }
        if (form.id === "cook-recipe-form") {
            let ingredients;
            try {
                ingredients = JSON.parse(values.ingredients_json);
            } catch {
                throw new Error("Ingredients must be valid JSON");
            }
            if (!Array.isArray(ingredients) || !ingredients.length)
                throw new Error("Add at least one actual ingredient");
            const recipe = {
                name: values.name,
                servings: Number(values.servings),
                instructions: String(values.instructions || "")
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                source_type: "user_entered",
                ingredients: ingredients.map((ingredient) => ({
                    ...ingredient,
                    source_type: ingredient.source_type || "user_supplied",
                })),
            };
            const result = await api(
                `/api/app/cooks/${encodeURIComponent(form.dataset.cookId)}/save-recipe`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        dish_id: form.dataset.dishId,
                        recipe,
                        scope: "personal",
                        idempotency_key: crypto.randomUUID(),
                    }),
                    keepPrevious: true,
                },
            );
            toast(
                `Recipe saved at revision ${result.result?.revisionId || "1"}; cook history preserved.`,
            );
            await openCook(form.dataset.cookId);
            return;
        }
        if (form.id === "saved-food-form") {
            const result = await api("/api/app/foods", {
                method: "POST",
                body: JSON.stringify({
                    candidate_id: form.dataset.candidateId,
                    label: values.label,
                    default_portion_id: values.default_portion_id || undefined,
                }),
                keepPrevious: true,
            });
            toast(`Saved ${result.saved_food?.label || "food"} for reuse.`);
            await openSavedFoodsManager();
            return;
        }
        if (form.id === "meal-form") {
            const items = mealComposerPayload();
            const result = await api("/api/app/meals", {
                method: "POST",
                body: JSON.stringify({
                    description: values.description,
                    meal_type: values.meal_type,
                    logged_at: values.logged_at,
                    notes: values.notes || undefined,
                    idempotency_key: crypto.randomUUID(),
                    items,
                }),
                keepPrevious: true,
            });
            toast(
                result.deduplicated
                    ? "This meal was already logged."
                    : "Meal logged.",
            );
        }
        if (form.id === "meal-draft-create-form") {
            const result = await api("/api/app/meal-drafts", {
                method: "POST",
                body: JSON.stringify({
                    source_mode: values.source_mode,
                    description: values.description,
                    meal_type: values.meal_type,
                    logged_at: values.logged_at,
                    notes: values.notes || undefined,
                }),
                keepPrevious: true,
            });
            toast("Meal draft started.");
            await openMealDraft(result.draft.id);
        }
        if (form.id === "edit-meal-form") {
            await api(`/api/app/meals/${encodeURIComponent(form.dataset.id)}`, {
                method: "PATCH",
                body: JSON.stringify(values),
                keepPrevious: true,
            });
            toast("Meal updated.");
        }
        if (form.id === "water-form") {
            await api("/api/app/water", {
                method: "POST",
                body: JSON.stringify(values),
                keepPrevious: true,
            });
            toast("Water added.");
        }
        if (form.id === "weight-form") {
            await api("/api/app/weight", {
                method: "POST",
                body: JSON.stringify(values),
                keepPrevious: true,
            });
            toast("Weight added.");
        }
        if (form.id === "edit-water-form") {
            await api(`/api/app/water/${encodeURIComponent(form.dataset.id)}`, {
                method: "PATCH",
                body: JSON.stringify({
                    amount_ml: Number(values.amount_ml),
                    notes: values.notes || null,
                }),
                keepPrevious: true,
            });
            toast("Water entry updated.");
        }
        if (form.id === "edit-weight-form") {
            await api(
                `/api/app/weight/${encodeURIComponent(form.dataset.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        weight: Number(values.weight),
                        unit: values.unit,
                        notes: values.notes || null,
                    }),
                    keepPrevious: true,
                },
            );
            toast("Weight entry updated.");
        }
        if (form.id === "preferences-form") {
            values.widgets_enabled = form.elements.widgets_enabled.checked;
            values.preferred_weight_unit = values.preferred_weight_unit || null;
            await api("/api/app/preferences", {
                method: "PUT",
                body: JSON.stringify(values),
                keepPrevious: true,
            });
            state.bootstrap = null;
            toast("Preferences saved.");
        }
        if (form.id === "goals-form") {
            if (
                !window.confirm(
                    "Save these nutrition targets? They will be added to your goal history.",
                )
            )
                return;
            await api("/api/app/goals", {
                method: "PUT",
                body: JSON.stringify({
                    ...values,
                    confirm: true,
                    idempotency_key: crypto.randomUUID(),
                }),
                keepPrevious: true,
            });
            toast("Goals saved.");
        }
        if (form.id === "recipe-create-form") {
            await api("/api/app/recipes", {
                method: "POST",
                body: JSON.stringify({
                    scope: values.scope || "personal",
                    idempotency_key: crypto.randomUUID(),
                    recipe: recipePayloadFromForm(values),
                }),
                keepPrevious: true,
            });
            toast(
                values.source_type === "imported"
                    ? "Imported recipe saved."
                    : "Recipe created.",
            );
            recipeImport.draft = null;
        }
        if (form.id === "recipe-compose-form") {
            const result = await api("/api/app/recipes/compose", {
                method: "POST",
                body: JSON.stringify({
                    scope: values.scope || "personal",
                    planned_date: values.planned_date,
                    meal_slot: values.meal_slot || undefined,
                    planned_servings: Number(values.planned_servings),
                    note: values.note || undefined,
                    grocery_items_needed: recipeGroceryItemsPayload(),
                    idempotency_key: crypto.randomUUID(),
                    recipe: recipePayloadFromForm(values),
                }),
                keepPrevious: true,
            });
            const groceryCount = result.result?.grocery?.items?.length || 0;
            toast(
                `Recipe saved and planned; ${groceryCount} grocery item${groceryCount === 1 ? "" : "s"} added.`,
            );
        }
        if (form.id === "recipe-edit-form") {
            await api(
                `/api/app/recipes/${encodeURIComponent(form.dataset.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        expected_version: Number(form.dataset.version),
                        idempotency_key: crypto.randomUUID(),
                        recipe: recipePayloadFromForm(values),
                    }),
                    keepPrevious: true,
                },
            );
            toast("Recipe updated with a new revision.");
        }
        if (form.id === "recipe-log-form") {
            const result = await api(
                `/api/app/recipes/${encodeURIComponent(form.dataset.id)}/log`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        servings_consumed: Number(values.servings_consumed),
                        meal_type: values.meal_type,
                        notes: values.notes || undefined,
                        recipe_revision_id: form.dataset.revision || undefined,
                        idempotency_key: crypto.randomUUID(),
                    }),
                    keepPrevious: true,
                },
            );
            toast(
                result.result?.deduplicated
                    ? "This recipe meal was already logged."
                    : "Recipe meal logged.",
            );
        }
        if (form.id === "recipe-plan-form") {
            await api(
                `/api/app/recipes/${encodeURIComponent(form.dataset.id)}/plan`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        planned_date: values.planned_date,
                        meal_slot: values.meal_slot,
                        servings: Number(values.servings),
                        idempotency_key: crypto.randomUUID(),
                    }),
                    keepPrevious: true,
                },
            );
            toast("Recipe added to the meal plan.");
        }
        if (form.id === "grocery-add-form") {
            await api("/api/app/groceries/items", {
                method: "POST",
                body: JSON.stringify({
                    scope: form.dataset.scope,
                    item: {
                        name: values.name,
                        quantity:
                            values.quantity === ""
                                ? null
                                : Number(values.quantity),
                        unit: values.unit || undefined,
                        note: values.note || undefined,
                        idempotency_key: crypto.randomUUID(),
                    },
                }),
                keepPrevious: true,
            });
            toast("Grocery item added.");
        }
        if (form.id === "grocery-edit-form") {
            await api(
                `/api/app/groceries/items/${encodeURIComponent(form.dataset.id)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        scope: form.dataset.scope,
                        expected_version: Number(form.dataset.version),
                        item: {
                            name: values.name,
                            quantity:
                                values.quantity === ""
                                    ? null
                                    : Number(values.quantity),
                            unit: values.unit || undefined,
                            note: values.note || undefined,
                        },
                    }),
                    keepPrevious: true,
                },
            );
            toast("Grocery item updated.");
        }
        if (dialog.open) dialog.close();
        await renderRoute();
    } catch (error) {
        toast(error.message || "Save failed", "error");
    } finally {
        submit.disabled = false;
    }
});

refreshButton.addEventListener("click", renderRoute);
quickAction.addEventListener("click", () => {
    toast(
        "Open your AI assistant and ask Munch to log, search, plan, or review nutrition data.",
    );
});
window.addEventListener("popstate", renderRoute);
renderRoute();
