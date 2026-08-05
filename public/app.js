const state = {
    bootstrap: null,
    route: "today",
    date: null,
    controller: null,
};

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
    "/app/plan": "plan",
    "/app/groceries": "groceries",
    "/app/household": "household",
    "/app/settings": "settings",
    "/app/settings/profile": "settings",
    "/app/settings/goals": "settings",
    "/app/settings/connections": "settings",
    "/app/settings/billing": "settings",
    "/app/settings/import-export": "settings",
    "/app/settings/privacy": "settings",
};

const titles = {
    today: ["Daily workspace", "Today"],
    log: ["Nutrition history", "Food Log"],
    insights: ["Patterns and progress", "Insights"],
    foods: ["Reusable nutrition data", "Foods"],
    recipes: ["Structured cooking memory", "Recipes"],
    plan: ["Personal and household", "Meal Plan"],
    groceries: ["Shopping workspace", "Groceries"],
    household: ["Shared workspace", "Household"],
    settings: ["Account and preferences", "Settings"],
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

function formatTime(value) {
    if (!value) return "Time not recorded";
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: state.bootstrap?.profile?.timezone || "UTC",
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
    const response = await fetch(path, {
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
        ...options,
        signal: options.signal || controller.signal,
    });
    if (response.status === 401) {
        location.href = `/connect/sign-in?return_to=${encodeURIComponent(location.pathname + location.search)}`;
        throw new Error("Authentication required");
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(data.message || data.error || "Request failed");
    return data;
}

function setLoading(label = "Loading your Munch workspace…") {
    content.innerHTML = `<div class="loading-state"><div><div class="skeleton" style="width:180px;height:18px"></div><div class="skeleton spacer-top" style="width:min(70vw,360px);height:54px"></div><p class="spacer-top">${escapeHtml(label)}</p></div></div>`;
}

function errorState(error) {
    if (error?.name === "AbortError") return;
    content.innerHTML = `<div class="error-state"><div><h2>That view could not be loaded.</h2><p>${escapeHtml(error?.message || "An unexpected error occurred.")}</p><button class="button button-primary spacer-top" data-action="refresh">Try again</button></div></div>`;
}

function setActiveRoute(route) {
    document.querySelectorAll("[data-route]").forEach((link) => {
        link.classList.toggle("is-active", link.dataset.route === route);
        if (link.dataset.route === route)
            link.setAttribute("aria-current", "page");
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

function mealCard(meal) {
    const type = meal.meal_type || "snack";
    return `<article class="meal-card" data-meal-id="${escapeHtml(meal.id)}"><div class="meal-card-head"><div><h4>${escapeHtml(meal.description || "Untitled meal")}</h4><div class="meal-meta"><span>${escapeHtml(formatTime(meal.logged_at))}</span><span>${escapeHtml(type)}</span>${meal.notes ? `<span>${escapeHtml(meal.notes)}</span>` : ""}</div></div><strong>${meal.calories == null ? "—" : `${number(meal.calories)} kcal`}</strong></div><div class="meal-macros"><span class="macro-chip">Protein ${number(meal.protein_g, 1)}g</span><span class="macro-chip">Carbs ${number(meal.carbs_g, 1)}g</span><span class="macro-chip">Fat ${number(meal.fat_g, 1)}g</span>${meal.fiber_g == null ? "" : `<span class="macro-chip">Fiber ${number(meal.fiber_g, 1)}g</span>`}${meal.sugar_g == null ? "" : `<span class="macro-chip">Sugar ${number(meal.sugar_g, 1)}g</span>`}</div>${mealItems(meal.items)}<div class="auth-actions"><button class="button button-secondary button-small" data-action="edit-meal" data-id="${escapeHtml(meal.id)}">Edit</button><button class="button button-quiet button-small" data-action="duplicate-meal" data-id="${escapeHtml(meal.id)}">Duplicate</button><button class="button button-quiet button-small" data-action="delete-meal" data-id="${escapeHtml(meal.id)}">Delete</button></div></article>`;
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

async function renderToday() {
    setLoading("Loading today’s meals and progress…");
    const data = await api(
        `/api/app/today?date=${encodeURIComponent(state.date)}`,
    );
    const goals = data.goals || {};
    const latestWeight = data.weight?.at(-1);
    content.innerHTML = `<div class="page-heading"><div><h2>${escapeHtml(formatDate(state.date, { weekday: true }))}</h2><p>Your structured nutrition record for this day.</p></div><div class="auth-actions"><button class="button button-secondary button-small" data-action="date-prev">Previous</button><button class="button button-secondary button-small" data-action="date-today">Today</button><button class="button button-secondary button-small" data-action="date-next">Next</button></div></div><div class="dashboard-grid"><section class="panel panel-span-12"><div class="summary-grid">${metricCard("Calories", data.totals.calories, " kcal", goals.daily_calories, true)}${metricCard("Protein", data.totals.proteinG, "g", goals.daily_protein_g)}${metricCard("Carbohydrates", data.totals.carbsG, "g", goals.daily_carbs_g)}${metricCard("Fat", data.totals.fatG, "g", goals.daily_fat_g)}</div></section><section class="panel panel-span-8"><div class="panel-title"><h3>Meals</h3><span>${data.meals.length} logged</span></div>${groupedMeals(data.meals)}</section><aside class="panel panel-span-4"><div class="panel-title"><h3>Daily details</h3></div><div class="summary-grid" style="grid-template-columns:1fr 1fr">${metricCard("Water", data.water.totalMl, " ml", goals.daily_water_ml)}${metricCard("Weight", latestWeight ? latestWeight.weight_g / 1000 : null, " kg", null)}</div><div class="auth-actions"><button class="button button-secondary button-small" data-action="add-water">Add water</button><button class="button button-secondary button-small" data-action="add-weight">Add weight</button></div>${data.drafts?.length ? `<div class="panel-title spacer-top"><h3>Pending drafts</h3><span>${data.drafts.length}</span></div><div class="meal-groups">${data.drafts.map((draft) => `<article class="meal-card"><strong>${escapeHtml(draft.description || `${draft.sourceMode} meal`)}</strong><p>${draft.openQuestionCount ? `${draft.openQuestionCount} question${draft.openQuestionCount === 1 ? "" : "s"} remaining` : "Ready for confirmation"}</p><small>Continue this draft in ChatGPT.</small></article>`).join("")}</div>` : ""}${data.plannedMeals?.length ? `<div class="panel-title spacer-top"><h3>Planned today</h3><span>${data.plannedMeals.length}</span></div>${data.plannedMeals.map((meal) => `<div class="food-row"><div><strong>${escapeHtml(meal.recipe_name)}</strong><small>${escapeHtml(meal.meal_slot || "Meal")} · ${number(meal.servings, 1)} servings</small></div><span>${meal.nutrition_per_serving?.calories ? `${number(meal.nutrition_per_serving.calories * meal.servings)} kcal` : ""}</span></div>`).join("")}` : ""}</aside></div>`;
}

async function renderLog() {
    setLoading("Loading your food history…");
    const data = await api(
        `/api/app/meals?start=${encodeURIComponent(state.date)}&end=${encodeURIComponent(state.date)}`,
    );
    content.innerHTML = `<div class="page-heading"><div><h2>${escapeHtml(formatDate(state.date, { weekday: true }))}</h2><p>Review meals, item-level provenance, notes, and totals.</p></div><div class="auth-actions"><button class="button button-secondary button-small" data-action="date-prev">Previous</button><button class="button button-secondary button-small" data-action="date-today">Today</button><button class="button button-secondary button-small" data-action="date-next">Next</button></div></div><section class="panel"><div class="summary-grid">${metricCard("Calories", data.totals.calories, " kcal", null, true)}${metricCard("Protein", data.totals.proteinG, "g", null)}${metricCard("Carbohydrates", data.totals.carbsG, "g", null)}${metricCard("Fat", data.totals.fatG, "g", null)}</div></section><div class="spacer-top">${groupedMeals(data.meals)}</div>`;
}

function barChart(days, key, label, unit = "") {
    const values = days.map((day) => Number(day.totals[key] || 0));
    const max = Math.max(1, ...values);
    return `<div role="img" aria-label="${escapeHtml(label)} by logged day" style="display:flex;align-items:flex-end;gap:5px;height:190px;padding-top:20px">${days
        .map((day, index) => {
            const height = Math.max(2, Math.round((values[index] / max) * 150));
            return `<div style="display:flex;min-width:0;flex:1;flex-direction:column;align-items:center;justify-content:flex-end;height:100%"><span class="tiny">${number(values[index])}</span><div style="width:100%;max-width:24px;height:${height}px;border-radius:7px 7px 2px 2px;background:var(--green-600)"></div><span class="tiny">${escapeHtml(day.date.slice(5))}</span></div>`;
        })
        .join(
            "",
        )}</div><p class="tiny">${escapeHtml(label)} is shown for logged days only${unit ? ` in ${escapeHtml(unit)}` : ""}.</p>`;
}

async function renderInsights() {
    setLoading("Calculating trends and patterns…");
    const end = state.date;
    const start = shiftDate(end, -29);
    const data = await api(`/api/app/insights?start=${start}&end=${end}`);
    content.innerHTML = `<div class="page-heading"><div><h2>Last 30 days</h2><p>${data.loggedDays} logged days and ${data.mealCount} meals from ${escapeHtml(formatDate(start))} through ${escapeHtml(formatDate(end))}.</p></div><div class="auth-actions"><button class="button button-secondary button-small" data-action="insight-range" data-days="7">7 days</button><button class="button button-secondary button-small" data-action="insight-range" data-days="30">30 days</button><button class="button button-secondary button-small" data-action="insight-range" data-days="90">90 days</button></div></div><div class="dashboard-grid"><section class="panel panel-span-12"><div class="summary-grid">${metricCard("Average calories", data.averages.calories, " kcal", null, true)}${metricCard("Average protein", data.averages.proteinG, "g", null)}${metricCard("Average carbs", data.averages.carbsG, "g", null)}${metricCard("Average fat", data.averages.fatG, "g", null)}</div></section><section class="panel panel-span-8"><div class="panel-title"><h3>Daily calories</h3><span>${data.loggedDays} days</span></div>${data.days.length ? barChart(data.days, "calories", "Daily calories", "kilocalories") : `<div class="empty-state"><div><h3>No logged days</h3><p>Log meals to build a trend.</p></div></div>`}</section><section class="panel panel-span-4"><div class="panel-title"><h3>Coverage</h3></div><div class="summary-grid" style="grid-template-columns:1fr 1fr">${metricCard("Logged days", data.loggedDays, "", null)}${metricCard("Calendar days", data.calendarDays, "", null)}${metricCard("Meals", data.mealCount, "", null)}${metricCard("Meals per logged day", data.loggedDays ? data.mealCount / data.loggedDays : 0, "", null)}</div><p class="tiny spacer-top">Averages exclude days with no meal records. Missing nutrients are not automatically treated as confirmed zero values in source-level records.</p></section></div>`;
}

async function renderFoods() {
    setLoading("Loading saved foods…");
    const data = await api("/api/app/foods");
    content.innerHTML = `<div class="page-heading"><div><h2>Saved foods</h2><p>${data.total} reusable food${data.total === 1 ? "" : "s"}${data.limit ? ` of ${data.limit}` : ""}.</p></div><div class="auth-actions"><input class="input" id="food-filter" type="search" placeholder="Filter saved foods" aria-label="Filter saved foods" /></div></div><section class="panel"><div id="food-list">${data.foods.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Food</th><th>Source</th><th>Default portion</th><th>Used</th><th>Last used</th></tr></thead><tbody>${data.foods.map((food) => `<tr data-food-label="${escapeHtml(food.label.toLowerCase())}"><td><strong>${escapeHtml(food.label)}</strong><br /><small>${escapeHtml(food.food?.brand || food.food?.name || "")}</small></td><td>${sourceBadge(food.provider)}</td><td>${escapeHtml(food.defaultPortionId || "Choose when logging")}</td><td>${number(food.useCount)}</td><td>${food.lastUsedAt ? escapeHtml(formatDate(food.lastUsedAt.slice(0, 10), { year: true })) : "Never"}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-state"><div><h3>No saved foods yet</h3><p>Confirm a provider food in ChatGPT, then save it for reuse.</p></div></div>`}</div></section>`;
}

function premiumUnavailable(title, description) {
    return `<div class="empty-state"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><a class="button button-primary spacer-top" href="/app/settings/billing">View website options</a></div></div>`;
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
    if (!data.available) {
        content.innerHTML = premiumUnavailable(
            "Recipe workspace is not available for this account",
            "Recipes are managed from the Munch website when the account has recipe capability.",
        );
        return;
    }
    content.innerHTML = `<div class="page-heading"><div><h2>Recipe library</h2><p>${data.recipes.length} structured recipe${data.recipes.length === 1 ? "" : "s"}.</p></div><input class="input" id="recipe-filter" type="search" placeholder="Filter recipes" aria-label="Filter recipes" /></div><div class="capability-grid" id="recipe-grid">${data.recipes.length ? data.recipes.map((recipe) => `<article class="capability-card" data-recipe-name="${escapeHtml(recipe.name.toLowerCase())}"><span class="source-chip ${recipe.ownership === "household" ? "source-saved" : "source-usda"}">${escapeHtml(recipe.ownership)}</span><h3 class="spacer-top">${escapeHtml(recipe.name)}</h3><p>${number(recipe.servings, 1)} servings · ${escapeHtml(recipe.nutrition_status)}</p><div class="meal-macros"><span class="macro-chip">${number(recipe.nutrition_per_serving?.calories)} kcal</span><span class="macro-chip">P ${number(recipe.nutrition_per_serving?.protein_g, 1)}g</span><span class="macro-chip">C ${number(recipe.nutrition_per_serving?.carbs_g, 1)}g</span><span class="macro-chip">F ${number(recipe.nutrition_per_serving?.fat_g, 1)}g</span></div><p class="tiny spacer-top">Scheduled ${number(recipe.times_scheduled)} times · logged ${number(recipe.times_logged)} times</p></article>`).join("") : `<div class="empty-state"><div><h3>No recipes yet</h3><p>Ask ChatGPT to save a complete recipe after the ingredients and servings are established.</p></div></div>`}</div>`;
}

function weekDays(start) {
    return Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
}

async function renderPlan() {
    setLoading("Loading the meal plan…");
    const data = await planningData();
    if (!data.available) {
        content.innerHTML = premiumUnavailable(
            "Meal planning is not available for this account",
            "The website meal calendar appears when the account has planning capability.",
        );
        return;
    }
    const start = shiftDate(
        state.date,
        -((new Date(`${state.date}T12:00:00Z`).getUTCDay() + 6) % 7),
    );
    const byDate = Object.groupBy(
        data.plannedMeals,
        (meal) => meal.planned_date,
    );
    content.innerHTML = `<div class="page-heading"><div><h2>Week of ${escapeHtml(formatDate(start))}</h2><p>Planned meals stay separate from foods you actually logged.</p></div><div class="auth-actions"><button class="button button-secondary button-small" data-action="date-week-prev">Previous week</button><button class="button button-secondary button-small" data-action="date-today">This week</button><button class="button button-secondary button-small" data-action="date-week-next">Next week</button></div></div><div class="meal-groups">${weekDays(
        start,
    )
        .map(
            (date) =>
                `<section class="meal-group"><header class="meal-group-header"><div><strong>${escapeHtml(formatDate(date, { weekday: true }))}</strong></div><span>${(byDate[date] || []).length} planned</span></header>${(byDate[date] || []).length ? (byDate[date] || []).map((meal) => `<article class="meal-card"><div class="meal-card-head"><div><h4>${escapeHtml(meal.recipe_name)}</h4><div class="meal-meta"><span>${escapeHtml(meal.meal_slot || "Meal")}</span><span>${escapeHtml(meal.ownership)}</span>${meal.created_by ? `<span>Added by ${escapeHtml(meal.created_by)}</span>` : ""}</div></div><strong>${number(meal.servings, 1)} servings</strong></div><div class="meal-macros"><span class="macro-chip">${number((meal.nutrition_per_serving?.calories || 0) * meal.servings)} kcal</span><span class="macro-chip">P ${number((meal.nutrition_per_serving?.protein_g || 0) * meal.servings, 1)}g</span></div></article>`).join("") : `<div class="meal-card"><p>No meals planned.</p></div>`}</section>`,
        )
        .join("")}</div>`;
}

async function renderGroceries() {
    setLoading("Loading grocery lists…");
    const data = await planningData();
    if (!data.available) {
        content.innerHTML = premiumUnavailable(
            "Grocery lists are not available for this account",
            "The shopping workspace appears when the account has planning capability.",
        );
        return;
    }
    content.innerHTML = `<div class="page-heading"><div><h2>Groceries</h2><p>Explicit shopping lists only. Munch does not infer pantry inventory.</p></div><button class="button button-secondary button-small" data-action="shopping-mode">Shopping mode</button></div><div class="dashboard-grid">${data.groceries.map((list) => `<section class="panel panel-span-6"><div class="panel-title"><h3>${list.scope === "household" ? "Household list" : "Personal list"}</h3><span>${list.items.length} items</span></div>${list.items.length ? `<div class="meal-groups">${list.items.map((item) => `<label class="food-row"><div><strong>${escapeHtml(item.name)}</strong><small>${item.quantity == null ? "" : `${number(item.quantity, 2)} ${escapeHtml(item.unit || "")}`}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</small></div><input type="checkbox" ${item.purchased_at ? "checked" : ""} disabled aria-label="${escapeHtml(item.name)} purchased" /></label>`).join("")}</div>` : `<div class="empty-state"><div><h3>The list is empty</h3><p>Ask ChatGPT to add the groceries you explicitly need.</p></div></div>`}</section>`).join("")}</div>`;
}

async function renderHousehold() {
    setLoading("Loading household workspace…");
    const data = await api("/api/app/household");
    if (!data.household) {
        content.innerHTML = `<div class="empty-state"><div><h2>No household is connected</h2><p>Create or join a household to share recipes, planned meals, and grocery lists. Personal nutrition records remain private.</p><a class="button button-primary spacer-top" href="/app/settings">Open household settings</a></div></div>`;
        return;
    }
    content.innerHTML = `<div class="page-heading"><div><h2>${escapeHtml(data.household.householdName)}</h2><p>Your role: ${escapeHtml(data.household.role)}. Shared activity uses the display name ${escapeHtml(data.household.displayName)}.</p></div></div><div class="dashboard-grid"><section class="panel panel-span-7"><div class="panel-title"><h3>Members</h3><span>${data.members.length}</span></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Role</th><th>Joined</th></tr></thead><tbody>${data.members.map((member) => `<tr><td><strong>${escapeHtml(member.displayName)}</strong></td><td>${escapeHtml(member.role)}</td><td>${escapeHtml(formatDate(member.joinedAt.slice(0, 10), { year: true }))}</td></tr>`).join("")}</tbody></table></div></section><aside class="panel panel-span-5"><div class="panel-title"><h3>Privacy boundary</h3></div><p>Household recipes, planned meals, and grocery lists are shared. Personal meals, water, weight, goals, and saved foods are not shared merely because you belong to this household.</p><a class="text-link" href="/privacy#households">Review household privacy →</a></aside></div>`;
}

function settingSection(title, description, body) {
    return `<section class="panel"><div class="panel-title"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div></div>${body}</section>`;
}

async function renderSettings() {
    setLoading("Loading settings…");
    const data = await api("/api/app/settings");
    const profile = data.profile || {};
    const subscription = data.subscription || {};
    content.innerHTML = `<div class="page-heading"><div><h2>Settings</h2><p>Profile, goals, connections, website billing, import, export, and privacy controls.</p></div></div><div class="dashboard-grid"><div class="panel-span-7" style="display:grid;gap:18px">${settingSection("Profile and display", "Timezone and units control how records are grouped and shown.", `<form id="preferences-form" class="auth-form"><label class="field"><span>Timezone</span><input name="timezone" value="${escapeHtml(profile.timezone || "UTC")}" required /></label><label class="field"><span>Weight unit</span><select name="preferred_weight_unit"><option value="">Require an explicit unit</option><option value="lb" ${profile.preferred_weight_unit === "lb" ? "selected" : ""}>Pounds</option><option value="kg" ${profile.preferred_weight_unit === "kg" ? "selected" : ""}>Kilograms</option></select></label><label class="field"><span><input name="widgets_enabled" type="checkbox" ${profile.widgets_enabled !== false ? "checked" : ""} /> Show visual widgets in supported ChatGPT clients</span></label><button class="button button-primary" type="submit">Save preferences</button></form>`)}${settingSection("Nutrition goals", "Targets are values you choose. Munch does not determine medical or dietary goals.", `<form id="goals-form" class="auth-form"><div class="summary-grid"><label class="field"><span>Calories</span><input name="daily_calories" type="number" min="0" value="${escapeHtml(data.goals?.daily_calories || "")}" /></label><label class="field"><span>Protein (g)</span><input name="daily_protein_g" type="number" min="0" step="0.1" value="${escapeHtml(data.goals?.daily_protein_g || "")}" /></label><label class="field"><span>Carbs (g)</span><input name="daily_carbs_g" type="number" min="0" step="0.1" value="${escapeHtml(data.goals?.daily_carbs_g || "")}" /></label><label class="field"><span>Fat (g)</span><input name="daily_fat_g" type="number" min="0" step="0.1" value="${escapeHtml(data.goals?.daily_fat_g || "")}" /></label></div><button class="button button-primary" type="submit">Save goals</button></form>`)}</div><div class="panel-span-5" style="display:grid;gap:18px">${settingSection("Website billing", "Commerce is managed only on the Munch website.", `<p><strong>${escapeHtml(subscription.status || "No active subscription")}</strong></p><div class="auth-actions">${data.capabilities.tier === "premium" ? `<button class="button button-secondary" data-action="billing-portal">Manage billing</button>` : `<button class="button button-primary" data-action="billing-checkout">Get Premium — $4.99/month</button>`}</div>`)}${settingSection("Authorized connections", "Revoke a specific ChatGPT or MCP connection without deleting your data.", data.connections.length ? data.connections.map((connection) => `<div class="food-row"><div><strong>${escapeHtml(connection.clientName || connection.clientId)}</strong><small>${number(connection.activeAccessTokens)} access token · expires ${escapeHtml(formatDate(connection.expiresAt.slice(0, 10), { year: true }))}</small></div><a class="button button-secondary button-small" href="/account/portal">Manage</a></div>`).join("") : `<p>No active connections were found.</p>`)}${settingSection("Import and export", "Bring in supported history or download a private copy of your data.", `<div class="auth-actions"><button class="button button-secondary" data-action="open-chatgpt-import">Import meals</button><button class="button button-secondary" data-action="export-account">Export account data</button></div>`)}${settingSection("Privacy and account", "Review policies or use the protected account controls.", `<div class="auth-actions"><a class="button button-secondary" href="/privacy">Privacy policy</a><a class="button button-secondary" href="/security">Security</a><a class="button button-quiet" href="/account/portal">Advanced account controls</a><button class="button button-quiet" data-action="logout">Sign out</button></div>`)}</div></div>`;
}

async function renderRoute() {
    state.route = routes[location.pathname] || "today";
    setActiveRoute(state.route);
    try {
        if (!state.bootstrap) {
            state.bootstrap = await api("/api/app/bootstrap");
            state.date = dateInTimezone(
                state.bootstrap.profile?.timezone || "UTC",
            );
        }
        const renderers = {
            today: renderToday,
            log: renderLog,
            insights: renderInsights,
            foods: renderFoods,
            recipes: renderRecipes,
            plan: renderPlan,
            groceries: renderGroceries,
            household: renderHousehold,
            settings: renderSettings,
        };
        await (renderers[state.route] || renderToday)();
        content.focus({ preventScroll: true });
    } catch (error) {
        errorState(error);
    }
}

function navigate(href) {
    history.pushState({}, "", href);
    renderRoute();
}

function findMeal(id) {
    const card = document.querySelector(`[data-meal-id="${CSS.escape(id)}"]`);
    return card ? card.querySelector("h4")?.textContent || "Meal" : "Meal";
}

function openDialog(title, body, actions = "") {
    dialog.innerHTML = `<form method="dialog" class="auth-card" style="min-width:min(92vw,520px);max-height:85vh;overflow:auto"><div class="panel-title"><h2 style="font-size:1.6rem">${escapeHtml(title)}</h2><button class="button button-quiet button-small" value="cancel" aria-label="Close">Close</button></div>${body}${actions}</form>`;
    dialog.showModal();
}

async function editMeal(id) {
    const card = document.querySelector(`[data-meal-id="${CSS.escape(id)}"]`);
    const description = card?.querySelector("h4")?.textContent || "";
    openDialog(
        "Edit meal",
        `<form id="edit-meal-form" class="auth-form" data-id="${escapeHtml(id)}"><label class="field"><span>Description</span><textarea name="description" rows="4" required>${escapeHtml(description)}</textarea></label><label class="field"><span>Meal type</span><select name="meal_type"><option>breakfast</option><option>lunch</option><option>dinner</option><option>snack</option></select></label><button class="button button-primary" type="submit">Save meal</button></form>`,
    );
}

async function handleAction(button) {
    const action = button.dataset.action;
    if (!action) return;
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
    if (action === "edit-meal") return editMeal(button.dataset.id);
    if (action === "duplicate-meal") {
        toast(
            "Open ChatGPT and ask Munch to log this meal again. The original entry was not changed.",
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
    if (action === "add-water") {
        openDialog(
            "Add water",
            `<form id="water-form" class="auth-form"><label class="field"><span>Amount (milliliters)</span><input name="amount_ml" type="number" min="1" max="20000" value="350" required /></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add water</button></form>`,
        );
        return;
    }
    if (action === "add-weight") {
        openDialog(
            "Add weight",
            `<form id="weight-form" class="auth-form"><label class="field"><span>Weight</span><input name="weight" type="number" min="1" step="0.1" required /></label><label class="field"><span>Unit</span><select name="unit"><option value="lb" ${state.bootstrap.profile?.preferred_weight_unit === "lb" ? "selected" : ""}>lb</option><option value="kg" ${state.bootstrap.profile?.preferred_weight_unit === "kg" ? "selected" : ""}>kg</option></select></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add weight</button></form>`,
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
    if (action === "open-chatgpt-import") {
        toast("Open ChatGPT and ask Munch to import your meal-history file.");
        return;
    }
    if (action === "export-account") {
        location.href = "/account/portal";
        return;
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

document.addEventListener("input", (event) => {
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

document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (
        ![
            "edit-meal-form",
            "water-form",
            "weight-form",
            "preferences-form",
            "goals-form",
        ].includes(form.id)
    )
        return;
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form));
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
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
            await api("/api/app/goals", {
                method: "PUT",
                body: JSON.stringify(values),
                keepPrevious: true,
            });
            toast("Goals saved.");
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
        "Open ChatGPT and ask Munch to log, search, plan, or review nutrition data.",
    );
});
window.addEventListener("popstate", renderRoute);
renderRoute();
