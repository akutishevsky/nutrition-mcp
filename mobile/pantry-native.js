import { requestJson as api, scanInstalledBarcode } from "./mobile-runtime.js";
// Photo-flow P8: pantry/receipt capture is the shared capture
// control's job now (public/photo-capture.js on the web,
// mobile/capture-native.js packaged). This module keeps only the
// barcode lane that is genuinely pantry-specific.
import "./capture-native.js";

const $ = (selector) => document.querySelector(selector);

function status(message, error = false) {
    const target = $("#status");
    if (!target) return;
    target.textContent = message || "";
    target.style.color = error ? "#8c2f22" : "#5d5344";
}

function currentScope() {
    return $("#scope")?.value || "personal";
}

function locationValue() {
    return $("#native-barcode-location")?.value || "unspecified";
}

function createButton(text, onClick, className = "secondary") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
}

function clearBarcodeReview() {
    $("#native-barcode-review")?.remove();
}

function renderBarcodeReview(barcode, candidate) {
    clearBarcodeReview();
    const card = document.createElement("section");
    card.id = "native-barcode-review";
    card.className = "card stack";

    const heading = document.createElement("div");
    heading.innerHTML = '<p class="eyebrow">Barcode match</p><h2></h2>';
    heading.querySelector("h2").textContent = candidate.name;

    const details = document.createElement("p");
    details.className = "muted";
    details.textContent = [
        candidate.brand,
        candidate.provider ? `verified by ${candidate.provider}` : null,
        `barcode ${barcode}`,
    ]
        .filter(Boolean)
        .join(" · ");

    const location = document.createElement("label");
    location.textContent = "Store in ";
    const select = document.createElement("select");
    select.id = "native-barcode-location";
    for (const [value, text] of [
        ["unspecified", "Unsorted"],
        ["pantry", "Pantry"],
        ["fridge", "Fridge"],
        ["freezer", "Freezer"],
    ]) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        select.append(option);
    }
    location.append(select);

    const actions = document.createElement("div");
    actions.style.display = "grid";
    actions.style.gridTemplateColumns = "1fr 1fr";
    actions.style.gap = "8px";
    const add = createButton(
        "Add to Pantry",
        async () => {
            add.disabled = true;
            status("Adding scanned product…");
            try {
                await api("/api/app/pantry/reconcile", {
                    method: "POST",
                    body: JSON.stringify({
                        scope: currentScope(),
                        source_type: "pantry_scan",
                        idempotency_key: `mobile-barcode:${crypto.randomUUID()}`,
                        operations: [
                            {
                                action: "acquire",
                                name: candidate.name,
                                location: locationValue(),
                                quantity_mode: "presence_only",
                                food_provider: candidate.provider || undefined,
                                provider_food_id:
                                    candidate.provider_food_id || undefined,
                                barcode,
                                confidence:
                                    typeof candidate.confidence === "number"
                                        ? candidate.confidence
                                        : candidate.verified
                                          ? 1
                                          : undefined,
                            },
                        ],
                    }),
                });
                status(`${candidate.name} added to Pantry.`);
                clearBarcodeReview();
                $("#refresh")?.click();
            } catch (error) {
                status(
                    error?.message || "Unable to add scanned product.",
                    true,
                );
                add.disabled = false;
            }
        },
        "",
    );
    const cancel = createButton("Cancel", () => {
        clearBarcodeReview();
        status("");
    });
    actions.append(add, cancel);
    card.append(heading, details, location, actions);

    const workspace = $("#workspace");
    const inventory = $(".inventory-section");
    if (workspace && inventory) workspace.insertBefore(card, inventory);
    else workspace?.append(card);
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function scanBarcode() {
    status("Opening barcode scanner…");
    clearBarcodeReview();
    try {
        const result = await scanInstalledBarcode();
        const barcode = String(result?.ScanResult || "").trim();
        if (!barcode) {
            status("");
            return;
        }
        status("Looking up product…");
        const candidate = await api(
            `/api/app/food-barcode?barcode=${encodeURIComponent(barcode)}`,
        );
        if (!candidate) {
            status(
                `No verified food match was found for barcode ${barcode}. Use Quick add instead.`,
                true,
            );
            return;
        }
        renderBarcodeReview(barcode, candidate);
        status("Review the product before adding it to Pantry.");
    } catch (error) {
        const message = String(
            error?.message || error || "Barcode scan failed.",
        );
        if (/cancel/i.test(message)) status("");
        else status(message, true);
    }
}

function injectBarcodeCard() {
    const grid = $(".grid-two");
    if (!grid || $("#native-barcode-card")) return;
    const card = document.createElement("section");
    card.id = "native-barcode-card";
    card.className = "card stack";
    card.innerHTML =
        '<div><p class="eyebrow">Barcode</p><h2>Scan a packaged food</h2></div>' +
        '<p class="muted">Use the device camera to identify a packaged food, then review the verified product before adding it.</p>';
    card.append(createButton("Scan barcode", scanBarcode, ""));
    grid.append(card);
}

injectBarcodeCard();
