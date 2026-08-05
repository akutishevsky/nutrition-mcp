const patchDialog = document.getElementById("app-dialog");

function patchEscape(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function showPatchedDialog(title, body) {
    patchDialog.innerHTML = `<div class="auth-card"><div class="panel-title"><h2 style="font-size:1.6rem">${patchEscape(title)}</h2><button class="button button-quiet button-small" type="button" data-patch-close aria-label="Close dialog">Close</button></div>${body}</div>`;
    patchDialog.showModal();
}

document.addEventListener(
    "click",
    (event) => {
        const close = event.target.closest("[data-patch-close]");
        if (close) {
            event.preventDefault();
            event.stopPropagation();
            patchDialog.close();
            return;
        }

        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        if (
            !action ||
            !["edit-meal", "add-water", "add-weight"].includes(action)
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (action === "edit-meal") {
            const id = button.dataset.id || "";
            const card = document.querySelector(
                `[data-meal-id="${CSS.escape(id)}"]`,
            );
            const description = card?.querySelector("h4")?.textContent || "";
            const type =
                [...(card?.querySelectorAll(".meal-meta span") || [])]
                    .map((item) => item.textContent)
                    .find((value) =>
                        ["breakfast", "lunch", "dinner", "snack"].includes(
                            value,
                        ),
                    ) || "snack";
            showPatchedDialog(
                "Edit meal",
                `<form id="edit-meal-form" class="auth-form" data-id="${patchEscape(id)}"><label class="field"><span>Description</span><textarea name="description" rows="4" required>${patchEscape(description)}</textarea></label><label class="field"><span>Meal type</span><select name="meal_type">${["breakfast", "lunch", "dinner", "snack"].map((value) => `<option value="${value}" ${value === type ? "selected" : ""}>${value}</option>`).join("")}</select></label><button class="button button-primary" type="submit">Save meal</button></form>`,
            );
            return;
        }

        if (action === "add-water") {
            showPatchedDialog(
                "Add water",
                `<form id="water-form" class="auth-form"><label class="field"><span>Amount (milliliters)</span><input name="amount_ml" type="number" min="1" max="20000" value="350" inputmode="numeric" required /></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add water</button></form>`,
            );
            return;
        }

        const preferredUnit =
            document.querySelector("select[name='preferred_weight_unit']")
                ?.value || "lb";
        showPatchedDialog(
            "Add weight",
            `<form id="weight-form" class="auth-form"><label class="field"><span>Weight</span><input name="weight" type="number" min="1" step="0.1" inputmode="decimal" required /></label><label class="field"><span>Unit</span><select name="unit"><option value="lb" ${preferredUnit === "lb" ? "selected" : ""}>lb</option><option value="kg" ${preferredUnit === "kg" ? "selected" : ""}>kg</option></select></label><label class="field"><span>Notes</span><input name="notes" placeholder="Optional" /></label><button class="button button-primary" type="submit">Add weight</button></form>`,
        );
    },
    true,
);

patchDialog.addEventListener("click", (event) => {
    if (event.target === patchDialog) patchDialog.close();
});
