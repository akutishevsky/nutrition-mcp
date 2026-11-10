import { installOfflineBanner, requestJson as api } from "./app-api.js";

installOfflineBanner();

const $ = (selector) => document.querySelector(selector);
const enabledToggle = $("#pantry-enabled");
const workspace = $("#workspace");
const statusEl = $("#status");
const inventoryEl = $("#inventory");
const emptyEl = $("#empty");
const itemCountEl = $("#item-count");
const scopeEl = $("#scope");
const searchEl = $("#search");
const locationChipsEl = $("#location-chips");
const lowstockEl = $("#lowstock");
let locationFilter = "";
const reviewEl = $("#review");
const reviewLinesEl = $("#review-lines");
const reviewTitleEl = $("#review-title");
const applyReviewEl = $("#apply-review");
const mealIdeaForm = $("#meal-idea-form");
const mealIdeaStatusEl = $("#meal-idea-status");
const mealIdeasEl = $("#meal-ideas");

let reviewState = null;

function status(message, error = false) {
    statusEl.textContent = message || "";
    statusEl.style.color = error ? "#8c2f22" : "#5d5344";
}

function mealStatus(message, error = false) {
    mealIdeaStatusEl.textContent = message || "";
    mealIdeaStatusEl.style.color = error ? "#8c2f22" : "#5d5344";
}

function currentScope() {
    return scopeEl.value || "personal";
}

async function loadSettings() {
    try {
        const settings = await api("/api/app/pantry/settings");
        enabledToggle.checked = settings.enabled === true;
        if (
            settings.household_available &&
            !scopeEl.querySelector('option[value="household"]')
        ) {
            const option = document.createElement("option");
            option.value = "household";
            option.textContent = "Household Pantry";
            scopeEl.append(option);
        }
        workspace.classList.toggle("hidden", !settings.enabled);
        if (settings.enabled) await loadPantry();
    } catch (error) {
        status(error.message, true);
    }
}

async function setEnabled(enabled) {
    try {
        status(enabled ? "Enabling Pantry…" : "Disabling Pantry…");
        const result = await api("/api/app/pantry/settings", {
            method: "PATCH",
            body: JSON.stringify({ enabled }),
        });
        enabledToggle.checked = result.enabled;
        workspace.classList.toggle("hidden", !result.enabled);
        status(
            result.enabled
                ? "Pantry enabled. Your AI assistant will expose Pantry tools on the next refresh."
                : "Pantry disabled. Existing inventory is preserved.",
        );
        if (result.enabled) await loadPantry();
    } catch (error) {
        enabledToggle.checked = !enabled;
        status(error.message, true);
    }
}

enabledToggle.addEventListener("change", () =>
    setEnabled(enabledToggle.checked),
);

function quantityLabel(item) {
    if (item.quantity == null)
        return item.stock_state === "low" ? "Low" : "On hand";
    const prefix = item.quantity_mode === "approximate" ? "≈ " : "";
    return `${prefix}${Number(item.quantity).toLocaleString()}${item.unit ? ` ${item.unit}` : ""}`;
}

const LOCATION_LABELS = {
    pantry: "Pantry",
    fridge: "Fridge",
    freezer: "Freezer",
    unspecified: "Unsorted",
};

let editingItem = null;
const itemEditorEl = $("#item-editor");
const itemEditorForm = $("#item-editor-form");
const itemEditorNameEl = $("#item-editor-name");

function closeItemEditor() {
    editingItem = null;
    itemEditorEl.classList.add("hidden");
}

// UX fix wave F6: a row tap opens the item's detail/edit sheet. The
// name is read-only (it comes from the food's source record; no
// endpoint renames an inventory item) — quantity, unit, quantity
// mode, location, status and note are editable and save through the
// reconcile API's correct/move operations below.
function openItemEditor(item) {
    editingItem = item;
    itemEditorNameEl.textContent = item.name;
    const form = itemEditorForm;
    form.elements.quantity.value = item.quantity ?? "";
    form.elements.unit.value = item.unit ?? "";
    form.elements.quantity_mode.value = item.quantity_mode || "exact";
    form.elements.location.value = item.location || "unspecified";
    form.elements.stock_state.value = item.stock_state || "available";
    form.elements.note.value = item.note ?? "";
    itemEditorEl.classList.remove("hidden");
    itemEditorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    form.elements.quantity.focus({ preventScroll: true });
}

itemEditorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const item = editingItem;
    if (!item) return;
    const form = new FormData(itemEditorForm);
    const mode = String(form.get("quantity_mode") || "exact");
    const quantityRaw = String(form.get("quantity") ?? "").trim();
    const correct = {
        action: "correct",
        inventory_item_id: item.id,
        unit: String(form.get("unit") || "").trim() || null,
        quantity_mode: mode,
        stock_state: String(form.get("stock_state") || "available"),
        note: String(form.get("note") || "").trim() || null,
    };
    // presence_only items carry no amount; a blank quantity in the
    // other modes means "leave it as recorded", so the field is
    // omitted rather than sent as a destructive null.
    if (mode === "presence_only") correct.quantity = null;
    else if (quantityRaw !== "") correct.quantity = Number(quantityRaw);
    const operations = [correct];
    const location = String(form.get("location") || "unspecified");
    if (location !== item.location) {
        operations.push({
            action: "move",
            inventory_item_id: item.id,
            location,
        });
    }
    try {
        status("Saving item…");
        await api("/api/app/pantry/reconcile", {
            method: "POST",
            body: JSON.stringify({
                scope: currentScope(),
                source_type: "correction",
                idempotency_key: `web-pantry:${crypto.randomUUID()}`,
                operations,
            }),
        });
        closeItemEditor();
        await loadPantry();
        // After the reload: loadPantry clears the status line when it
        // finishes, so the confirmation is posted last to survive it.
        status(`${item.name} updated.`);
    } catch (error) {
        status(error.message, true);
    }
});

$("#item-editor-cancel").addEventListener("click", closeItemEditor);

function renderInventory(items) {
    inventoryEl.replaceChildren();
    itemCountEl.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
    emptyEl.classList.toggle("hidden", items.length !== 0);
    // Low-stock summary (tightened mock's warn panel, from real data):
    // one merged line naming every low item, inside the inventory head.
    const lowItems = items.filter((item) => item.stock_state === "low");
    lowstockEl.replaceChildren();
    lowstockEl.classList.toggle("hidden", lowItems.length === 0);
    if (lowItems.length) {
        const lead = document.createElement("strong");
        lead.textContent = "Low stock: ";
        const names = document.createElement("span");
        names.textContent = lowItems
            .map(
                (item) => `${item.name} (${quantityLabel(item).toLowerCase()})`,
            )
            .join(", ");
        lowstockEl.append(lead, names);
    }
    for (const item of items) {
        const row = document.createElement("div");
        row.className = `inventory-row stock-${item.stock_state}`;
        // One merged line (density law): name · quantity · location ·
        // provenance/mode — nothing is hidden at phone width.
        const main = document.createElement("div");
        main.className = "inventory-main";
        const name = document.createElement("strong");
        name.textContent = item.name;
        const meta = document.createElement("span");
        meta.className = "meta";
        // "exact" is the default quantity mode and carries no signal on
        // the row; provider identity and non-default modes stay visible.
        const detail =
            item.food_provider && item.provider_food_id
                ? `${item.food_provider} · verified identity`
                : item.quantity_mode !== "exact"
                  ? item.quantity_mode.replaceAll("_", " ")
                  : null;
        meta.textContent =
            ` · ${quantityLabel(item)} · ${LOCATION_LABELS[item.location] || item.location}` +
            (detail ? ` · ${detail}` : "");
        main.append(name, meta);
        // F6: the row's main area is the edit affordance — click /
        // Enter / Space opens the item editor. The Finished button
        // stays a separate target and never triggers it.
        main.classList.add("inventory-main-edit");
        main.tabIndex = 0;
        main.setAttribute("role", "button");
        main.setAttribute("aria-label", `Edit ${item.name}`);
        main.addEventListener("click", () => openItemEditor(item));
        main.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openItemEditor(item);
            }
        });
        const tag = document.createElement("span");
        if (item.stock_state === "low") {
            tag.className = "tag low";
            tag.textContent = "Low stock";
        } else if (item.stock_state === "depleted") {
            tag.className = "tag depleted";
            tag.textContent = "Depleted";
        } else {
            tag.className = "tag";
            tag.textContent = "On hand";
        }
        const finished = document.createElement("button");
        finished.type = "button";
        finished.className = "row-action";
        finished.textContent =
            item.stock_state === "depleted" ? "Depleted" : "Finished";
        finished.disabled = item.stock_state === "depleted";
        finished.addEventListener("click", () =>
            reconcileOperations(
                [{ action: "consume_all", inventory_item_id: item.id }],
                "correction",
            ),
        );
        row.append(main, tag, finished);
        inventoryEl.append(row);
    }
}

async function loadPantry() {
    if (!enabledToggle.checked) return;
    try {
        status("Loading Pantry…");
        const query = new URLSearchParams({ scope: currentScope() });
        if (searchEl.value.trim()) query.set("q", searchEl.value.trim());
        if (locationFilter) query.set("location", locationFilter);
        const pantry = await api(`/api/app/pantry?${query}`);
        renderInventory(pantry.items || []);
        status("");
    } catch (error) {
        status(error.message, true);
    }
}

$("#refresh").addEventListener("click", loadPantry);
scopeEl.addEventListener("change", loadPantry);
for (const chip of locationChipsEl.querySelectorAll(".fchip")) {
    chip.addEventListener("click", () => {
        locationFilter = chip.dataset.location || "";
        for (const other of locationChipsEl.querySelectorAll(".fchip")) {
            const active = other === chip;
            other.classList.toggle("on", active);
            other.setAttribute("aria-pressed", String(active));
        }
        loadPantry();
    });
}
let searchTimer;
searchEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadPantry, 250);
});

async function reconcileOperations(operations, sourceType = "manual") {
    try {
        status("Updating Pantry…");
        await api("/api/app/pantry/reconcile", {
            method: "POST",
            body: JSON.stringify({
                scope: currentScope(),
                source_type: sourceType,
                idempotency_key: `web-pantry:${crypto.randomUUID()}`,
                operations,
            }),
        });
        await loadPantry();
    } catch (error) {
        status(error.message, true);
    }
}

$("#manual-add").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = form.get("quantity");
    const operation = {
        action: "acquire",
        name: String(form.get("name") || "").trim(),
        location: String(form.get("location") || "unspecified"),
    };
    if (quantity !== "") operation.quantity = Number(quantity);
    if (form.get("unit")) operation.unit = String(form.get("unit"));
    await reconcileOperations([operation]);
    event.currentTarget.reset();
});

function renderReview(mode, preview, sourceLabel) {
    reviewState = {
        mode,
        lines: preview.lines || [],
        sourceLabel,
        idempotencyKey: `${mode}:${crypto.randomUUID()}`,
    };
    reviewTitleEl.textContent =
        mode === "receipt" ? "Receipt items" : "Detected Pantry items";
    reviewLinesEl.replaceChildren();
    reviewState.lines.forEach((line, index) => {
        const row = document.createElement("label");
        row.className = "review-row";
        const check = document.createElement("input");
        check.type = "checkbox";
        check.dataset.index = String(index);
        check.checked = line.is_food && line.confidence >= 0.85;
        check.disabled = !line.is_food;
        const name = document.createElement("span");
        name.className = "review-name";
        name.textContent = line.name;
        const quantity = document.createElement("span");
        quantity.className = "review-qty";
        quantity.textContent =
            line.quantity == null ? "—" : String(line.quantity);
        const unit = document.createElement("span");
        unit.className = "review-unit";
        unit.textContent = line.unit || "";
        const confidence = document.createElement("span");
        confidence.className = "confidence";
        confidence.textContent = line.is_food
            ? `${Math.round(line.confidence * 100)}% confidence`
            : "non-food";
        row.append(check, name, quantity, unit, confidence);
        reviewLinesEl.append(row);
    });
    reviewEl.classList.remove("hidden");
    reviewEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function previewImage(input, endpoint, mode) {
    const file = input.files?.[0];
    if (!file) return status("Choose an image first.", true);
    if (file.size > 8 * 1024 * 1024)
        return status("Image exceeds the 8 MB Pantry limit.", true);
    const form = new FormData();
    form.append("file", file);
    try {
        status("Analyzing image…");
        const result = await api(endpoint, { method: "POST", body: form });
        renderReview(mode, result.preview, file.name);
        status("Review the detected items before applying them.");
    } catch (error) {
        status(error.message, true);
    }
}

$("#scan-pantry").addEventListener("click", () =>
    previewImage($("#pantry-photo"), "/api/app/pantry/scan-preview", "pantry"),
);
$("#scan-receipt").addEventListener("click", () =>
    previewImage(
        $("#receipt-photo"),
        "/api/app/purchases/receipt-preview",
        "receipt",
    ),
);

applyReviewEl.addEventListener("click", async () => {
    if (!reviewState) return;
    const checked = new Set(
        [
            ...reviewLinesEl.querySelectorAll('input[type="checkbox"]:checked'),
        ].map((input) => Number(input.dataset.index)),
    );
    try {
        if (reviewState.mode === "pantry") {
            const operations = reviewState.lines
                .map((line, index) => ({ line, index }))
                .filter(({ line, index }) => line.is_food && checked.has(index))
                .map(({ line }) => ({
                    action: "acquire",
                    name: line.name,
                    ...(line.quantity == null
                        ? {}
                        : { quantity: line.quantity }),
                    ...(line.unit ? { unit: line.unit } : {}),
                    location: line.location,
                    confidence: line.confidence,
                    quantity_mode:
                        line.quantity == null
                            ? "presence_only"
                            : line.confidence >= 0.95
                              ? "exact"
                              : "approximate",
                }));
            if (!operations.length)
                return status("Select at least one detected food.", true);
            await api("/api/app/pantry/reconcile", {
                method: "POST",
                body: JSON.stringify({
                    scope: currentScope(),
                    source_type: "pantry_scan",
                    idempotency_key: reviewState.idempotencyKey,
                    operations,
                }),
            });
            status(
                `${operations.length} detected item${operations.length === 1 ? "" : "s"} added to Pantry.`,
            );
        } else {
            const lines = reviewState.lines.map((line, index) => ({
                raw_label: line.raw_label,
                name: line.name,
                quantity: line.quantity,
                unit: line.unit,
                confidence: line.confidence,
                is_food: line.is_food,
                confirmed: checked.has(index),
                location: line.location,
            }));
            const result = await api("/api/app/purchases/reconcile", {
                method: "POST",
                body: JSON.stringify({
                    scope: currentScope(),
                    idempotency_key: reviewState.idempotencyKey,
                    source_label: reviewState.sourceLabel,
                    lines,
                }),
            });
            status(
                `Receipt reconciled: ${result.summary.groceryMatched} Grocery match${result.summary.groceryMatched === 1 ? "" : "es"}, ${result.summary.inventoryAdded} new Pantry acquisition${result.summary.inventoryAdded === 1 ? "" : "s"}${result.summary.needsReview ? `, ${result.summary.needsReview} left unresolved` : ""}.`,
            );
        }
        reviewState = null;
        reviewEl.classList.add("hidden");
        await loadPantry();
    } catch (error) {
        status(error.message, true);
    }
});

function addTextList(parent, label, values) {
    if (!Array.isArray(values) || values.length === 0) return;
    const block = document.createElement("div");
    block.className = "idea-detail";
    const title = document.createElement("strong");
    title.textContent = label;
    const text = document.createElement("span");
    text.textContent = values.join(", ");
    block.append(title, text);
    parent.append(block);
}

function renderMealIdeas(result) {
    mealIdeasEl.replaceChildren();
    const candidates = result?.candidates || [];
    for (const candidate of candidates) {
        const card = document.createElement("article");
        card.className = "meal-idea-card";

        const head = document.createElement("div");
        head.className = "meal-idea-head";
        const titleWrap = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = candidate.name;
        const description = document.createElement("p");
        description.className = "muted";
        description.textContent = candidate.description;
        titleWrap.append(title, description);
        const badge = document.createElement("span");
        badge.className = "pill";
        badge.textContent =
            candidate.source === "saved_recipe"
                ? "Saved recipe"
                : candidate.readiness.replaceAll("_", " ");
        head.append(titleWrap, badge);
        card.append(head);

        const metrics = document.createElement("div");
        metrics.className = "idea-metrics";
        const nutrition = candidate.estimated_nutrition || {};
        const metricValues = [
            nutrition.protein_g == null
                ? null
                : `${Math.round(nutrition.protein_g)} g protein`,
            nutrition.calories == null
                ? null
                : `~${Math.round(nutrition.calories)} kcal`,
            candidate.total_minutes == null
                ? null
                : `${candidate.total_minutes} min`,
        ].filter(Boolean);
        for (const value of metricValues) {
            const metric = document.createElement("span");
            metric.textContent = value;
            metrics.append(metric);
        }
        if (metricValues.length) card.append(metrics);

        addTextList(card, "Flavor system", candidate.flavor_system);
        addTextList(card, "On hand", candidate.on_hand_ingredients);
        addTextList(card, "Assumed staples", candidate.assumed_staples);
        addTextList(card, "Missing", candidate.missing_required);
        addTextList(card, "Optional", candidate.missing_optional);
        addTextList(card, "Why it fits", candidate.why_it_fits);
        mealIdeasEl.append(card);
    }
    if (!candidates.length) {
        const empty = document.createElement("p");
        empty.className = "empty";
        empty.textContent =
            "No grounded meal ideas were returned for this Pantry.";
        mealIdeasEl.append(empty);
    }
}

mealIdeaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(mealIdeaForm);
    const staples = String(form.get("assumed_staples") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 20);
    const maxMinutes = String(form.get("max_minutes") || "").trim();
    const button = $("#plan-meal");
    button.disabled = true;
    mealIdeasEl.replaceChildren();
    mealStatus(
        "Looking across your Pantry, fridge, freezer, seasonings, sauces, and saved recipes…",
    );
    try {
        const payload = await api("/api/app/pantry/meal-ideas", {
            method: "POST",
            body: JSON.stringify({
                scope: currentScope(),
                goal: String(form.get("goal") || "balanced"),
                meal_type: String(form.get("meal_type") || "dinner"),
                servings: Number(form.get("servings") || 2),
                ...(maxMinutes ? { max_minutes: Number(maxMinutes) } : {}),
                allow_missing_items: Number(
                    form.get("allow_missing_items") || 0,
                ),
                assumed_staples: staples,
            }),
        });
        renderMealIdeas(payload.result);
        const count = payload.result?.candidates?.length || 0;
        mealStatus(
            `Considered ${payload.context_summary?.pantry_items ?? "your"} Pantry items and ${payload.context_summary?.saved_recipe_candidates ?? 0} saved-recipe candidates; returned ${count} grounded meal idea${count === 1 ? "" : "s"}.`,
        );
    } catch (error) {
        const message =
            error.status === 503
                ? "Kitchen planning is not enabled on this Munch deployment yet."
                : error.message;
        mealStatus(message, true);
    } finally {
        button.disabled = false;
    }
});

loadSettings();
