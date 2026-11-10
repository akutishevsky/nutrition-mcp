import { savedWeightUnit } from "./weight-display.js";

const patchDialog = document.getElementById("app-dialog");
const patchToastRegion = document.getElementById("toast-region");
const patchMealEditor = {
    mealId: null,
    options: new Map(),
    searchTimer: null,
};

const patchNutrientFields = [
    ["calories", "Calories"],
    ["protein_g", "Protein (g)"],
    ["carbs_g", "Carbs (g)"],
    ["fat_g", "Fat (g)"],
    ["fiber_g", "Fiber (g)"],
    ["sugar_g", "Sugar (g)"],
    ["alcohol_g", "Alcohol (g)"],
    ["sodium_mg", "Sodium (mg)"],
];

function patchEscape(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function patchNumber(value, digits = 1) {
    if (value == null || Number.isNaN(Number(value))) return "";
    return Number(value).toFixed(digits).replace(/\.0+$/, "");
}

function patchToast(message, kind = "success") {
    if (!patchToastRegion) return;
    const element = document.createElement("div");
    element.className = "toast";
    element.textContent = message;
    if (kind === "error") element.style.borderColor = "var(--danger-700)";
    patchToastRegion.append(element);
    window.setTimeout(() => element.remove(), 4200);
}

async function patchApi(path, options = {}) {
    const response = await fetch(path, {
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
        ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(data.message || data.error || "Request failed");
    return data;
}

async function fetchPatchedPreferredWeightUnit() {
    try {
        const data = await patchApi("/api/app/bootstrap", {
            cache: "no-store",
        });
        return savedWeightUnit(data.profile?.preferred_weight_unit);
    } catch {
        return null;
    }
}

async function fetchMealDetail(id) {
    return patchApi(`/api/app/meals/${encodeURIComponent(id)}`, {
        cache: "no-store",
    });
}

function showPatchedDialog(title, body) {
    patchDialog.innerHTML = `<div class="auth-card"><div class="panel-title"><h2 style="font-size:1.6rem">${patchEscape(title)}</h2><button class="button button-quiet button-small dialog-close" type="button" data-patch-close aria-label="Close dialog">Close</button></div>${body}</div>`;
    patchDialog.showModal();
}

function sourceLabel(item) {
    if (item.sourceType === "usda") return "USDA FoodData Central";
    if (item.sourceType === "open_food_facts") return "Open Food Facts";
    if (item.sourceType === "published_restaurant")
        return "Published restaurant nutrition";
    if (item.sourceType === "saved_food") return "Saved food snapshot";
    if (item.sourceType === "past_meal") return "Past meal snapshot";
    if (item.sourceType === "model_estimate") return "Model estimate";
    if (
        item.sourceType === "user_supplied" &&
        item.sourceSnapshot?.resolution_layer === "external_web"
    ) {
        return item.provider
            ? `External web · ${item.provider.replaceAll("_", " ")}`
            : "External web";
    }
    if (item.sourceType === "user_supplied") return "Provided nutrition";
    return item.provider || item.sourceType || "Source recorded";
}

function nutrientInput(name, label, value) {
    const serialized = value == null ? "" : String(value);
    return `<label class="field"><span>${patchEscape(label)}</span><input name="${patchEscape(name)}" type="number" min="0" step="0.1" value="${patchEscape(serialized)}" data-original="${patchEscape(serialized)}" /></label>`;
}

function patchDateTimeValue(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (part) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function structuredItemEditor(meal) {
    if (!meal.items?.length) {
        return `<div class="meal-card spacer-top"><strong>Legacy aggregate entry</strong><p class="tiny">This meal predates item-level storage, so its original ingredient breakdown cannot be edited without inventing historical data.</p></div>`;
    }
    const targetOptions = meal.items
        .map(
            (item) =>
                `<option value="${patchEscape(item.id)}">Replace ${patchEscape(item.name)}</option>`,
        )
        .join("");
    const itemForms = meal.items
        .map((item) => {
            const n = item.nutrients || {};
            const confidence =
                item.confidence == null
                    ? ""
                    : ` · ${Math.round(item.confidence * 100)}% confidence`;
            const source = `${sourceLabel(item)}${confidence}`;
            const nutrientInputs = patchNutrientFields
                .map(([key, label]) => nutrientInput(key, label, n[key]))
                .join("");
            return `<form class="meal-card auth-form" data-patch-item-form data-meal-id="${patchEscape(meal.id)}" data-item-id="${patchEscape(item.id)}">
                <div class="meal-card-head"><div><h4>${patchEscape(item.name)}</h4><small>${patchEscape(source)}</small></div><strong>${n.calories == null ? "—" : `${patchNumber(n.calories, 0)} kcal`}</strong></div>
                <div class="summary-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
                    <label class="field" style="grid-column:1/-1"><span>Food name</span><input name="name" value="${patchEscape(item.name)}" data-original="${patchEscape(item.name)}" required /></label>
                    <label class="field"><span>Quantity</span><input name="quantity" type="number" min="0.01" step="0.01" value="${patchEscape(item.quantity ?? "")}" placeholder="Not recorded" /></label>
                    <label class="field"><span>Portion</span><input name="portion_label" value="${patchEscape(item.portionLabel ?? "")}" placeholder="e.g. 2 slices" /></label>
                    ${nutrientInputs}
                </div>
                ${item.sourceUrl ? `<a class="text-link tiny" href="${patchEscape(item.sourceUrl)}" target="_blank" rel="noreferrer">View nutrition source →</a>` : ""}
                ${item.assumptions?.length ? `<p class="tiny">Assumptions: ${patchEscape(item.assumptions.join("; "))}</p>` : ""}
                <div class="auth-actions"><button class="button button-secondary button-small" type="submit">Save food correction</button>${meal.items.length > 1 ? `<button class="button button-quiet button-small" type="button" data-patch-delete-item data-meal-id="${patchEscape(meal.id)}" data-item-id="${patchEscape(item.id)}" data-item-name="${patchEscape(item.name)}">Remove food</button>` : ""}</div>
            </form>`;
        })
        .join("");
    const manualFields = patchNutrientFields
        .map(
            ([key, label]) =>
                `<label class="field"><span>${patchEscape(label)}</span><input name="${patchEscape(key)}" type="number" min="0" step="0.1" /></label>`,
        )
        .join("");
    return `<div class="panel-title spacer-top"><div><h3>Foods</h3><p>Edit a correction or replace a food with a verified, saved, or recent snapshot.</p></div><span>${meal.items.length}</span></div><section class="meal-card spacer-top" data-patch-food-picker data-meal-id="${patchEscape(meal.id)}"><div class="panel-title"><div><h4>Replace or add food</h4><p class="tiny">Choose where the search result should go, then select a food.</p></div></div><label class="field"><span>Apply selection to</span><select id="patch-replace-target"><option value="">Add as a new food</option>${targetOptions}</select></label><form class="meal-composer-search-row" data-patch-food-search-form data-meal-id="${patchEscape(meal.id)}"><input class="input" name="query" id="patch-food-search" type="search" placeholder="Search oats, yogurt, chicken…" autocomplete="off" /><button class="button button-secondary button-small" type="submit">Search</button></form><div id="patch-food-results" class="meal-food-results"><p class="tiny">Loading personal and verified foods…</p></div></section><div class="meal-groups">${itemForms}</div><details class="meal-card"><summary><strong>Add manual food</strong></summary><form class="auth-form spacer-top" data-patch-new-item-form data-meal-id="${patchEscape(meal.id)}"><div class="summary-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><label class="field" style="grid-column:1/-1"><span>Food name</span><input name="name" required /></label><label class="field"><span>Quantity</span><input name="quantity" type="number" min="0.01" step="0.01" /></label><label class="field"><span>Portion</span><input name="portion_label" placeholder="e.g. 1 cup" /></label>${manualFields}<label class="field"><span>Source</span><select name="source_type"><option value="user_supplied">Label / manual value</option><option value="model_estimate">Estimate</option></select></label></div><label class="field"><span>Assumption or note</span><input name="assumption" placeholder="Optional" /></label><button class="button button-secondary button-small" type="submit">Add food</button></form></details>`;
}

function renderPatchFoodResults(data) {
    const root = document.getElementById("patch-food-results");
    if (!root) return;
    patchMealEditor.options.clear();
    const sections = [];
    if (data.candidates?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Verified foods</h4>${data.candidates
                .map((candidate, index) => {
                    const key = `candidate:${index}`;
                    patchMealEditor.options.set(key, {
                        kind: "candidate",
                        candidateId: candidate.candidate_id,
                        portionId: candidate.default_portion?.id,
                        label:
                            [candidate.brand, candidate.name]
                                .filter(Boolean)
                                .join(" — ") || candidate.name,
                        provider: candidate.provider,
                        calories: candidate.default_portion?.calories,
                    });
                    return `<button class="meal-search-result" type="button" data-patch-food-option data-key="${patchEscape(key)}"><span><strong>${patchEscape([candidate.brand, candidate.name].filter(Boolean).join(" — ") || candidate.name)}</strong><small>${patchEscape(candidate.provider || "Verified food")} · ${patchEscape(candidate.default_portion?.label || "Choose a portion in details")}</small></span><span>${candidate.default_portion?.calories == null ? "" : `${patchNumber(candidate.default_portion.calories, 0)} kcal`}</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.savedFoods?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Saved foods</h4>${data.savedFoods
                .map((saved, index) => {
                    const key = `saved:${index}`;
                    const portion =
                        saved.food?.portions?.find(
                            (item) => item.id === saved.defaultPortionId,
                        ) || saved.food?.portions?.[0];
                    patchMealEditor.options.set(key, {
                        kind: "saved",
                        savedFoodId: saved.id,
                        portionId: saved.defaultPortionId || portion?.id,
                        label: saved.label,
                        provider: saved.food?.provider,
                        calories: portion?.nutrients?.calories,
                    });
                    return `<button class="meal-search-result" type="button" data-patch-food-option data-key="${patchEscape(key)}"><span><strong>${patchEscape(saved.label)}</strong><small>Saved food · ${patchEscape(saved.food?.name || "Food snapshot")}</small></span><span>${portion?.nutrients?.calories == null ? "" : `${patchNumber(portion.nutrients.calories, 0)} kcal`}</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    if (data.recentMealItems?.length) {
        sections.push(
            `<div class="meal-search-section"><h4>Recent foods</h4>${data.recentMealItems
                .map((recent, index) => {
                    const key = `recent:${index}`;
                    patchMealEditor.options.set(key, {
                        kind: "recent",
                        recent,
                    });
                    return `<button class="meal-search-result" type="button" data-patch-food-option data-key="${patchEscape(key)}"><span><strong>${patchEscape(recent.name)}</strong><small>Recent meal · ${patchEscape(recent.portionLabel || "Portion not recorded")}</small></span><span>${recent.nutrients?.calories == null ? "" : `${patchNumber(recent.nutrients.calories, 0)} kcal`}</span></button>`;
                })
                .join("")}</div>`,
        );
    }
    root.innerHTML =
        sections.join("") ||
        `<p class="tiny">No foods found. Try another search or add a manual food.</p>`;
}

async function searchPatchFoods(query) {
    const root = document.getElementById("patch-food-results");
    if (!root) return;
    root.innerHTML = `<p class="tiny">Searching personal and verified foods…</p>`;
    try {
        const data = await patchApi(
            `/api/app/food-search?query=${encodeURIComponent(query)}&limit=8`,
            { cache: "no-store" },
        );
        renderPatchFoodResults(data);
    } catch (error) {
        root.innerHTML = `<p class="tiny">${patchEscape(error.message || "Food search failed")}</p>`;
    }
}

function patchFoodBody(option, replacing) {
    if (option.kind === "candidate") {
        return {
            candidate_id: option.candidateId,
            portion_id: option.portionId,
            quantity: 1,
            ...(replacing ? { replace_item: true } : {}),
        };
    }
    if (option.kind === "saved") {
        return {
            saved_food_id: option.savedFoodId,
            portion_id: option.portionId,
            quantity: 1,
            ...(replacing ? { replace_item: true } : {}),
        };
    }
    const recent = option.recent;
    return {
        name: recent.name,
        quantity: 1,
        portion_label: recent.portionLabel || undefined,
        nutrients: recent.nutrients,
        source_type: "past_meal",
        provider: recent.provider || undefined,
        provider_food_id: recent.providerFoodId || undefined,
        source_snapshot: {
            resolution_layer: "personal_history",
            meal_id: recent.mealId,
            item_id: recent.itemId,
        },
        ...(replacing ? { replace_item: true } : {}),
    };
}

async function applyPatchFoodOption(key) {
    const option = patchMealEditor.options.get(key);
    const mealId = patchMealEditor.mealId;
    const target = document.getElementById("patch-replace-target")?.value || "";
    if (!option || !mealId) return;
    const replacing = Boolean(target);
    const path = replacing
        ? `/api/app/meals/${encodeURIComponent(mealId)}/items/${encodeURIComponent(target)}`
        : `/api/app/meals/${encodeURIComponent(mealId)}/items`;
    await patchApi(path, {
        method: replacing ? "PATCH" : "POST",
        body: JSON.stringify(patchFoodBody(option, replacing)),
    });
    patchToast(
        replacing
            ? "Food replaced and totals recalculated."
            : "Food added and totals recalculated.",
    );
    await showMealEditor(mealId);
    refreshCurrentView();
}

async function showMealEditor(id) {
    const { meal } = await fetchMealDetail(id);
    patchMealEditor.mealId = id;
    patchMealEditor.options.clear();
    const type = ["breakfast", "lunch", "dinner", "snack"].includes(
        meal.mealType,
    )
        ? meal.mealType
        : "snack";
    showPatchedDialog(
        "Edit meal",
        `<form id="edit-meal-form" class="auth-form" data-id="${patchEscape(id)}"><label class="field"><span>Description</span><textarea name="description" rows="3" required>${patchEscape(meal.description || "")}</textarea></label><div class="meal-composer-grid"><label class="field"><span>Meal type</span><select name="meal_type">${["breakfast", "lunch", "dinner", "snack"].map((value) => `<option value="${value}" ${value === type ? "selected" : ""}>${value}</option>`).join("")}</select></label><label class="field"><span>Logged at</span><input name="logged_at" type="datetime-local" value="${patchEscape(patchDateTimeValue(meal.loggedAt))}" required /></label></div><label class="field"><span>Notes</span><textarea name="notes" rows="2" maxlength="4000">${patchEscape(meal.notes || "")}</textarea></label><button class="button button-primary" type="submit">Save meal details</button></form>${structuredItemEditor(meal)}`,
    );
    void searchPatchFoods("");
}

function refreshCurrentView() {
    // The header band's Refresh button is gone; app.js re-renders the
    // current view when it receives this event (see the `app:refresh`
    // listener in app.js).
    document.dispatchEvent(new CustomEvent("app:refresh"));
}

document.addEventListener(
    "click",
    async (event) => {
        const close = event.target.closest("[data-patch-close]");
        if (close) {
            event.preventDefault();
            event.stopImmediatePropagation();
            patchDialog.close();
            return;
        }

        const removeItem = event.target.closest("[data-patch-delete-item]");
        if (removeItem) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const mealId = removeItem.dataset.mealId || "";
            const itemId = removeItem.dataset.itemId || "";
            const itemName = removeItem.dataset.itemName || "this food";
            if (!confirm(`Remove ${itemName} from this meal?`)) return;
            try {
                await patchApi(
                    `/api/app/meals/${encodeURIComponent(mealId)}/items/${encodeURIComponent(itemId)}`,
                    { method: "DELETE" },
                );
                patchToast("Food removed and meal totals recalculated.");
                await showMealEditor(mealId);
                refreshCurrentView();
            } catch (error) {
                patchToast(error.message || "Could not remove food", "error");
            }
            return;
        }

        const foodOption = event.target.closest("[data-patch-food-option]");
        if (foodOption) {
            event.preventDefault();
            event.stopImmediatePropagation();
            try {
                await applyPatchFoodOption(foodOption.dataset.key || "");
            } catch (error) {
                patchToast(
                    error.message || "Could not apply food selection",
                    "error",
                );
            }
            return;
        }

        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        if (
            !action ||
            ![
                "edit-meal",
                "duplicate-meal",
                "add-water",
                "add-weight",
            ].includes(action)
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        if (action === "edit-meal") {
            try {
                await showMealEditor(button.dataset.id || "");
            } catch (error) {
                patchToast(error.message || "Could not load meal", "error");
            }
            return;
        }

        if (action === "duplicate-meal") {
            const id = button.dataset.id || "";
            try {
                await patchApi(
                    `/api/app/meals/${encodeURIComponent(id)}/copy`,
                    {
                        method: "POST",
                        body: "{}",
                    },
                );
                patchToast("Meal duplicated with its original food sources.");
                refreshCurrentView();
            } catch (error) {
                patchToast(
                    error.message || "Could not duplicate meal",
                    "error",
                );
            }
            return;
        }

        if (action === "add-water") {
            showPatchedDialog(
                "Add water",
                `<form id="water-form" class="auth-form"><label class="field"><span>Amount (milliliters)</span><input name="amount_ml" type="number" min="1" max="20000" value="350" inputmode="numeric" required /></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add water</button></form>`,
            );
            return;
        }

        const preferredUnit = await fetchPatchedPreferredWeightUnit();
        showPatchedDialog(
            "Add weight",
            `<form id="weight-form" class="auth-form"><label class="field"><span>Weight</span><input name="weight" type="number" min="1" step="0.1" inputmode="decimal" required /></label><label class="field"><span>Unit</span><select name="unit" required><option value="" disabled ${preferredUnit ? "" : "selected"}>Select unit</option><option value="lb" ${preferredUnit === "lb" ? "selected" : ""}>lb</option><option value="kg" ${preferredUnit === "kg" ? "selected" : ""}>kg</option></select></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add weight</button></form>`,
        );
    },
    true,
);

document.addEventListener(
    "submit",
    async (event) => {
        const form = event.target;

        if (!(form instanceof HTMLFormElement)) return;
        if (form.matches("[data-patch-food-search-form]")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const query = new FormData(form).get("query");
            await searchPatchFoods(String(query || ""));
            return;
        }
        if (form.matches("[data-patch-new-item-form]")) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const mealId = form.dataset.mealId || "";
            const values = Object.fromEntries(new FormData(form));
            const nutrients = {};
            for (const [field] of patchNutrientFields) {
                if (values[field] !== "") nutrients[field] = values[field];
            }
            const body = {
                name: values.name,
                ...(values.quantity !== ""
                    ? { quantity: values.quantity }
                    : {}),
                ...(values.portion_label !== ""
                    ? { portion_label: values.portion_label }
                    : {}),
                nutrients,
                source_type: values.source_type || "user_supplied",
                provider:
                    values.source_type === "model_estimate"
                        ? "manual_estimate"
                        : "user_correction",
                assumptions:
                    values.assumption === "" ? [] : [String(values.assumption)],
                source_snapshot: { resolution_layer: "website_manual_add" },
            };
            const submit = form.querySelector("button[type='submit']");
            if (submit) submit.disabled = true;
            try {
                await patchApi(
                    `/api/app/meals/${encodeURIComponent(mealId)}/items`,
                    { method: "POST", body: JSON.stringify(body) },
                );
                patchToast("Food added and meal totals recalculated.");
                await showMealEditor(mealId);
                refreshCurrentView();
            } catch (error) {
                patchToast(error.message || "Could not add food", "error");
            } finally {
                if (submit) submit.disabled = false;
            }
            return;
        }
        if (!form.matches("[data-patch-item-form]")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const mealId = form.dataset.mealId || "";
        const itemId = form.dataset.itemId || "";
        const values = Object.fromEntries(new FormData(form));
        const nutrients = {};
        for (const [field] of patchNutrientFields) {
            const input = form.elements.namedItem(field);
            if (
                input instanceof HTMLInputElement &&
                input.value !== "" &&
                input.value !== input.dataset.original
            ) {
                nutrients[field] = input.value;
            }
        }
        const nameInput = form.elements.namedItem("name");
        const body = {
            ...(nameInput instanceof HTMLInputElement &&
            nameInput.value !== nameInput.dataset.original
                ? { name: nameInput.value }
                : {}),
            ...(values.quantity !== "" ? { quantity: values.quantity } : {}),
            ...(values.portion_label !== ""
                ? { portion_label: values.portion_label }
                : {}),
            ...(Object.keys(nutrients).length ? { nutrients } : {}),
        };
        const submit = form.querySelector("button[type='submit']");
        if (submit) submit.disabled = true;
        try {
            await patchApi(
                `/api/app/meals/${encodeURIComponent(mealId)}/items/${encodeURIComponent(itemId)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify(body),
                },
            );
            patchToast("Food updated and meal totals recalculated.");
            await showMealEditor(mealId);
            refreshCurrentView();
        } catch (error) {
            patchToast(error.message || "Could not update food", "error");
        } finally {
            if (submit) submit.disabled = false;
        }
    },
    true,
);

patchDialog.addEventListener("click", (event) => {
    if (event.target === patchDialog) patchDialog.close();
});
