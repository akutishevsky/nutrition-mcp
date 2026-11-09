import { displayWeightUnit, weightFromGrams } from "./weight-display.js";

const SETTINGS_ROUTES = new Set([
    "settings",
    "settings-profile",
    "settings-goals",
    "settings-billing",
    "settings-connections",
    "settings-data",
    "settings-account",
]);

export const accountRoutes = {
    "/app/more": "more",
    "/app/household": "household",
    "/app/settings": "settings",
    "/app/settings/profile": "settings-profile",
    "/app/settings/goals": "settings-goals",
    "/app/settings/billing": "settings-billing",
    "/app/settings/connections": "settings-connections",
    "/app/settings/data": "settings-data",
    "/app/settings/import-export": "settings-data",
    "/app/settings/privacy": "settings-data",
    "/app/settings/account": "settings-account",
};

export const accountTitles = {
    more: ["Munch workspace", "More"],
    household: ["Shared workspace", "Household"],
    settings: ["Account and preferences", "Settings"],
    "settings-profile": ["Settings", "Profile & preferences"],
    "settings-goals": ["Settings", "Nutrition targets"],
    "settings-billing": ["Settings", "Plan & billing"],
    "settings-connections": ["Settings", "Connections"],
    "settings-data": ["Settings", "Data & privacy"],
    "settings-account": ["Settings", "Account"],
};

export function isAccountRoute(route) {
    return (
        route === "more" || route === "household" || SETTINGS_ROUTES.has(route)
    );
}

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function dollars(cents) {
    return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function requireProductPolicy(data) {
    const policy = data?.productPolicy;
    const premiumPriceMonthlyCents = Number(policy?.premiumPriceMonthlyCents);
    const householdMemberPriceMonthlyCents = Number(
        policy?.householdMemberPriceMonthlyCents,
    );
    const householdMemberLimit = Number(policy?.householdMemberLimit);
    if (
        !Number.isInteger(premiumPriceMonthlyCents) ||
        premiumPriceMonthlyCents <= 0 ||
        !Number.isInteger(householdMemberPriceMonthlyCents) ||
        householdMemberPriceMonthlyCents < 0 ||
        !Number.isInteger(householdMemberLimit) ||
        householdMemberLimit < 1
    ) {
        throw new Error("Product policy is unavailable");
    }
    return {
        premiumPriceMonthlyCents,
        householdMemberPriceMonthlyCents,
        householdMemberLimit,
    };
}

function formatDateTime(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function planLabel(data) {
    if (
        window.MunchAds &&
        data.capabilities?.entitlementSource === "android_free_baseline"
    ) {
        return "Free on Android";
    }
    if (data.capabilities?.entitlementSource === "household_subscription") {
        return "Premium through household";
    }
    return data.capabilities?.tier === "premium"
        ? "Munch Premium"
        : "Munch Free";
}

function settingsNav(active) {
    const items = [
        [
            "settings-profile",
            "/app/settings/profile",
            "Profile",
            "Identity, units and display",
        ],
        [
            "settings-goals",
            "/app/settings/goals",
            "Nutrition",
            "Targets you choose",
        ],
        [
            "settings-billing",
            "/app/settings/billing",
            "Plan & billing",
            "Subscription and charges",
        ],
        [
            "settings-connections",
            "/app/settings/connections",
            "Connections",
            "ChatGPT and MCP access",
        ],
        [
            "settings-data",
            "/app/settings/data",
            "Data & privacy",
            "Import, export and policies",
        ],
        [
            "settings-account",
            "/app/settings/account",
            "Account",
            "Sign out or delete account",
        ],
    ];
    return `<nav class="settings-local-nav" aria-label="Settings sections">${items
        .map(
            ([route, href, label, description]) =>
                `<a href="${href}" class="settings-local-link ${active === route ? "is-active" : ""}" ${active === route ? 'aria-current="page"' : ""}><span>${esc(label)}</span><small>${esc(description)}</small></a>`,
        )
        .join("")}</nav>`;
}

function settingsShell(active, body) {
    const back =
        active === "settings"
            ? ""
            : `<a class="settings-mobile-back" href="/app/settings">← Settings</a>`;
    return `<div class="settings-layout">${settingsNav(active)}<section class="settings-main">${back}${body}</section></div>`;
}

function sectionHeading(kicker, title, description, aside = "") {
    return `<header class="settings-page-head"><div><p class="settings-eyebrow">${esc(kicker)}</p><h2>${esc(title)}</h2><p>${esc(description)}</p></div>${aside}</header>`;
}

function settingsIndex(data) {
    const cards = [
        [
            "/app/settings/profile",
            "Profile & preferences",
            "Timezone, units, assistant display and tracking preferences",
            "Profile",
        ],
        [
            "/app/settings/goals",
            "Nutrition targets",
            "Calories, macros, water and optional targets",
            "Targets",
        ],
        [
            "/app/settings/billing",
            "Plan & billing",
            `${planLabel(data)} · subscription & charges`,
            "Billing",
        ],
        [
            "/app/settings/connections",
            "Connections",
            `${data.connections?.length || 0} authorized connection${data.connections?.length === 1 ? "" : "s"}`,
            "Access",
        ],
        [
            "/app/settings/data",
            "Data & privacy",
            "Import, export, privacy policy and security",
            "Data",
        ],
        [
            "/app/settings/account",
            "Account",
            "Signed in as " + (data.user?.email || "your Munch account"),
            "Account",
        ],
    ];
    return settingsShell(
        "settings",
        `${sectionHeading("Settings", "Your Munch settings", "Everything related to your account has one clear home. Household management lives in the Household workspace.")}<div class="settings-index-grid">${cards
            .map(
                ([href, title, description, label]) =>
                    `<a class="settings-index-card" href="${href}"><span class="settings-card-label">${esc(label)}</span><div><h3>${esc(title)}</h3><p>${esc(description)}</p></div><span class="settings-chevron" aria-hidden="true">›</span></a>`,
            )
            .join("")}</div>`,
    );
}

function timezoneField(profile) {
    return `<label class="settings-field"><span>Timezone</span><small>Controls which local day meals, water and weight belong to.</small><select name="timezone" id="settings-timezone" data-current-timezone="${esc(profile.timezone || "UTC")}" required><option value="${esc(profile.timezone || "UTC")}">${esc(profile.timezone || "UTC")}</option></select></label>`;
}

function profilePage(data) {
    const profile = data.profile || {};
    const alcoholEnabled = profile.alcohol_tracking_enabled === true;
    return settingsShell(
        "settings-profile",
        `${sectionHeading("Profile", "Profile & preferences", "Set how Munch groups and displays your records without mixing these choices into billing or household controls.")}<div class="account-identity-card"><div class="account-avatar" aria-hidden="true">${esc((data.user?.email || "M").slice(0, 1).toUpperCase())}</div><div><strong>${esc(data.user?.email || "Munch account")}</strong><span>${esc(planLabel(data))}</span></div><a href="/app/settings/billing">View plan</a></div><form id="settings-profile-form" class="settings-stack">${settingGroup("Display & units", "These choices affect presentation only.", `${timezoneField(profile)}<fieldset class="settings-field"><legend>Weight unit</legend><small>Used when Munch displays saved weights.</small><div class="segmented-control"><label><input type="radio" name="preferred_weight_unit" value="" ${!profile.preferred_weight_unit ? "checked" : ""}><span>Ask each time</span></label><label><input type="radio" name="preferred_weight_unit" value="lb" ${profile.preferred_weight_unit === "lb" ? "checked" : ""}><span>lb</span></label><label><input type="radio" name="preferred_weight_unit" value="kg" ${profile.preferred_weight_unit === "kg" ? "checked" : ""}><span>kg</span></label></div></fieldset>${toggleRow("widgets_enabled", "ChatGPT visual cards", "Show Munch visual widgets in supported ChatGPT clients.", profile.widgets_enabled !== false)}`)}${settingGroup("Optional tracking", "Keep optional tracking controls separate from your core profile.", `${toggleRow("alcohol_tracking_enabled", "Alcohol tracking", "Enable alcohol-specific fields and summaries when you choose to log drinks.", alcoholEnabled)}<label class="settings-field"><span>Drink units</span><small>Used for alcohol-related displays when tracking is enabled.</small><select name="preferred_drink_unit" ${alcoholEnabled ? "" : 'aria-describedby="drink-unit-note"'}><option value="" ${!profile.preferred_drink_unit ? "selected" : ""}>Default</option><option value="us" ${profile.preferred_drink_unit === "us" ? "selected" : ""}>US standard drinks</option><option value="uk" ${profile.preferred_drink_unit === "uk" ? "selected" : ""}>UK units</option></select><small id="drink-unit-note">This preference does not change the underlying nutrition record.</small></label>`)}<div class="settings-savebar"><span class="settings-save-status" role="status" aria-live="polite"></span><button class="button button-primary" type="submit">Save preferences</button></div></form>`,
    );
}

function settingGroup(title, description, body, className = "") {
    return `<section class="settings-group ${className}"><header><h3>${esc(title)}</h3><p>${esc(description)}</p></header><div class="settings-group-body">${body}</div></section>`;
}

function toggleRow(name, title, description, checked) {
    return `<label class="settings-toggle-row"><span><strong>${esc(title)}</strong><small>${esc(description)}</small></span><span class="switch"><input type="checkbox" name="${esc(name)}" ${checked ? "checked" : ""}><span aria-hidden="true"></span></span></label>`;
}

function nutrientInput(name, label, value, unit, options = {}) {
    const step = options.step || "0.1";
    return `<label class="settings-field compact"><span>${esc(label)}</span><div class="input-with-unit"><input name="${esc(name)}" type="number" min="0" step="${esc(step)}" value="${value == null ? "" : esc(value)}" inputmode="decimal"><span>${esc(unit)}</span></div></label>`;
}

function goalsPage(data) {
    const goals = data.goals || {};
    const unit = displayWeightUnit(data.profile?.preferred_weight_unit);
    const targetWeight =
        goals.target_weight_g == null
            ? ""
            : weightFromGrams(Number(goals.target_weight_g), unit)
                  .toFixed(1)
                  .replace(/\.0$/, "");
    return settingsShell(
        "settings-goals",
        `${sectionHeading("Nutrition", "Nutrition targets", "These are targets you choose. Munch stores and compares against them; it does not prescribe medical or dietary goals.")}<form id="settings-goals-form" class="settings-stack">${settingGroup("Daily energy & macros", "Leave any field blank if you do not want a target for it.", `<div class="settings-form-grid">${nutrientInput("daily_calories", "Calories", goals.daily_calories, "kcal", { step: "1" })}${nutrientInput("daily_protein_g", "Protein", goals.daily_protein_g, "g")}${nutrientInput("daily_carbs_g", "Carbohydrates", goals.daily_carbs_g, "g")}${nutrientInput("daily_fat_g", "Fat", goals.daily_fat_g, "g")}</div>`)}${settingGroup("Additional targets", "Optional targets remain separate from the primary macro summary.", `<div class="settings-form-grid">${nutrientInput("daily_fiber_g", "Fiber", goals.daily_fiber_g, "g")}${nutrientInput("daily_sugar_g", "Sugar", goals.daily_sugar_g, "g")}${nutrientInput("daily_water_ml", "Water", goals.daily_water_ml, "mL", { step: "1" })}${nutrientInput("daily_alcohol_g", "Alcohol", goals.daily_alcohol_g, "g")}</div><div class="settings-form-grid settings-form-grid-single spacer-top"><label class="settings-field compact"><span>Target weight</span><small>Optional. Uses your current display unit.</small><div class="input-with-unit"><input name="target_weight" type="number" min="1" step="0.1" value="${esc(targetWeight)}" inputmode="decimal"><span>${esc(unit)}</span></div><input type="hidden" name="unit" value="${esc(unit)}"></label></div>`)}<div class="settings-savebar"><span class="settings-save-status" role="status" aria-live="polite"></span><button class="button button-primary" type="submit">Preview target changes</button><button class="button button-secondary" type="button" data-action="guidance-preferences">Guidance preferences</button></div></form><section class="panel spacer-top" id="goal-guidance-review"><p>Loading goal review and history…</p></section><section class="panel spacer-top" id="goal-change-preview" aria-live="polite"></section>`,
    );
}

function statusPill(text, tone = "neutral") {
    return `<span class="account-status account-status-${tone}">${esc(text)}</span>`;
}

async function billingPage(data, ctx) {
    const policy = requireProductPolicy(data);
    const premiumPrice = dollars(policy.premiumPriceMonthlyCents);
    const seatPrice = dollars(policy.householdMemberPriceMonthlyCents);
    const androidFree =
        Boolean(window.MunchAds) &&
        data.capabilities?.entitlementSource === "android_free_baseline";
    let household = null;
    try {
        household = await ctx.api("/api/app/household/manage");
    } catch {
        household = null;
    }
    const householdProvided =
        data.capabilities?.entitlementSource === "household_subscription";
    const directPremium =
        data.capabilities?.tier === "premium" && !householdProvided;
    const status = data.subscription?.status || null;
    const provider = data.subscription?.provider || null;
    let billingSummary = androidFree ? "Free on Android" : "Free";
    let detail = androidFree
        ? data.androidEntitlements?.adFree
            ? "All non-AI Android features are included. Ads are off for this account through its existing entitlement."
            : "All non-AI Android features are included. A separate ad-free subscription is not configured in Google Play yet."
        : "Munch Free remains available without a subscription.";
    if (householdProvided) {
        billingSummary = "Premium through household";
        detail = `Your household owner pays for your ${seatPrice}/month seat. You are not billed separately for this entitlement.`;
    } else if (directPremium) {
        billingSummary =
            provider === "google_play"
                ? "Munch Premium · Google Play"
                : `Munch Premium · ${premiumPrice}/month`;
        if (provider === "google_play") {
            detail = status
                ? `Google Play subscription status: ${status}.`
                : "Your account currently has Google Play Premium capabilities.";
        } else if (provider === "stripe") {
            detail = status
                ? `Stripe subscription status: ${status}.`
                : "Your account currently has Premium capabilities.";
        } else {
            detail = "Your account currently has Premium capabilities.";
        }
    }
    const ownerHousehold =
        household?.household?.role === "owner" ? household : null;
    const total = ownerHousehold
        ? policy.premiumPriceMonthlyCents +
          policy.householdMemberPriceMonthlyCents *
              Number(ownerHousehold.activeNonOwnerCount || 0)
        : policy.premiumPriceMonthlyCents;
    const chargeCard =
        directPremium && provider !== "google_play"
            ? `<div class="billing-price"><span>Current Munch subscription</span><strong>${dollars(total)}<small>/month</small></strong>${ownerHousehold ? `<p>${premiumPrice} Premium + ${ownerHousehold.activeNonOwnerCount} household seat${ownerHousehold.activeNonOwnerCount === 1 ? "" : "s"} × ${seatPrice}.</p>` : `<p>Household members are ${seatPrice}/month each when added.</p>`}</div>`
            : "";
    const action = androidFree
        ? data.subscription?.provider === "stripe"
            ? `<button class="button button-secondary" data-action="billing-portal">Manage website and connected-client subscription</button>`
            : ""
        : householdProvided
          ? `<a class="button button-secondary" href="/app/household">View household</a>`
          : directPremium
            ? provider === "google_play"
                ? `<button class="button button-primary" data-action="billing-play-manage">Manage in Google Play</button>`
                : `<button class="button button-primary" data-action="billing-portal">Manage billing in Stripe</button>`
            : `<button class="button button-primary" data-action="billing-checkout">Get Premium — ${premiumPrice}/month</button>`;
    return settingsShell(
        "settings-billing",
        `${sectionHeading("Billing", "Plan & billing", androidFree ? "Android access and ads are managed separately from website billing." : "See exactly how your Munch access is funded. Manage payment and cancellation with the provider that owns the active subscription.")}<div class="settings-stack">${settingGroup(androidFree ? "Android access" : "Current plan", detail, `<div class="plan-summary"><div><span>${androidFree ? "Android plan" : "Plan"}</span><strong>${esc(androidFree ? (data.androidEntitlements?.adFree ? "Free · ad-free" : billingSummary) : billingSummary)}</strong></div>${statusPill(householdProvided ? "Household seat" : directPremium ? status || "Premium" : androidFree && data.androidEntitlements?.adFree ? "Ads off" : "Free", directPremium || householdProvided || (androidFree && data.androidEntitlements?.adFree) ? "success" : "neutral")}</div>${androidFree && data.subscription?.provider === "stripe" ? `<p class="settings-note">Your existing Munch Premium subscription remains active for website and connected-client access.</p>` : ""}${chargeCard}<div class="settings-actions">${action}</div>`)}${androidFree ? "" : settingGroup("Household pricing", "Discounted seats are part of a collaborative household, not standalone Premium accounts.", `<div class="pricing-rule"><strong>${premiumPrice}</strong><span>Premium owner</span></div><div class="pricing-rule"><strong>+${seatPrice}</strong><span>per additional active household member</span></div><p class="settings-note">Household recipes, meal plans and grocery lists are shared automatically while a discounted seat is active. Personal meals, water, weight and goals remain private.</p><a class="text-link" href="/app/household">Manage household →</a>`)}</div>`,
    );
}

function connectionsPage(data) {
    const connections = data.connections || [];
    return settingsShell(
        "settings-connections",
        `${sectionHeading("Access", "Connections", "Review the ChatGPT and MCP clients that can call Munch on your behalf.", statusPill(`${connections.length} active`, connections.length ? "success" : "neutral"))}${settingGroup("Connected account", "Every connection listed here uses this Munch account.", `<div class="account-detail-row"><span>Email</span><strong>${esc(data.user?.email || "Unavailable")}</strong></div>`)}${
            connections.length
                ? `<div class="connection-list">${connections
                      .map(
                          (connection) =>
                              `<article class="connection-card"><div class="connection-icon" aria-hidden="true">↗</div><div><h3>${esc(connection.clientName || "ChatGPT / MCP client")}</h3><p>${esc(connection.clientId)}</p><small>${Number(connection.activeAccessTokens || 0)} active access token${Number(connection.activeAccessTokens || 0) === 1 ? "" : "s"} · expires ${esc(formatDateTime(connection.expiresAt))}</small></div><button class="button button-secondary button-small" data-action="connection-revoke" data-token-family-id="${esc(connection.tokenFamilyId)}" data-client-name="${esc(connection.clientName || "this connection")}">Revoke</button></article>`,
                      )
                      .join("")}</div>`
                : `<div class="settings-empty"><span aria-hidden="true">✓</span><h3>No active connections</h3><p>Connect Munch from your AI assistant and authorized clients will appear here.</p></div>`
        }`,
    );
}

function dataPage() {
    return settingsShell(
        "settings-data",
        `${sectionHeading("Data", "Data & privacy", "Import or export your records and review the policies that define how Munch handles them.")}<div class="settings-stack">${settingGroup("Import & export", "Your export is generated as a private, short-lived download.", `<div class="settings-action-list"><button class="settings-action-row" data-action="open-import"><span><strong>Import meal history</strong><small>Upload, preview and confirm a supported CSV export.</small></span><span aria-hidden="true">›</span></button><button class="settings-action-row" data-action="export-meals"><span><strong>Export meal history</strong><small>Download only your logged meals as a CSV file.</small></span><span aria-hidden="true">↓</span></button><button class="settings-action-row" data-action="export-account"><span><strong>Export complete account data</strong><small>Download your personal data and household records you are authorized to view.</small></span><span aria-hidden="true">↓</span></button></div>`)}${window.MunchAds ? settingGroup("Advertising privacy", "Review or change the privacy choices used before Android ads are requested.", `<div class="settings-action-list"><button class="settings-action-row" data-action="ad-privacy-options"><span><strong>Advertising privacy choices</strong><small>Review or change your ad consent choices.</small></span><span aria-hidden="true">›</span></button></div>`) : ""}${settingGroup("Privacy & security", "Policies open in a new website page without changing your Munch records.", `<div class="settings-action-list"><a class="settings-action-row" href="/privacy"><span><strong>Privacy policy</strong><small>Data handling, household boundaries and retention.</small></span><span aria-hidden="true">›</span></a><a class="settings-action-row" href="/security"><span><strong>Security</strong><small>Security practices and vulnerability reporting.</small></span><span aria-hidden="true">›</span></a></div>`)}</div>`,
    );
}

function accountPage(data) {
    return settingsShell(
        "settings-account",
        `${sectionHeading("Account", "Account", "Identity, session controls and permanent account deletion are kept together and clearly separated from everyday preferences.")}<div class="settings-stack">${settingGroup("Signed-in account", "Your email is the identity used for magic-link sign in.", `<div class="account-detail-row"><span>Email</span><strong>${esc(data.user?.email || "Unavailable")}</strong></div><div class="settings-actions"><button class="button button-secondary" data-action="logout">Sign out</button></div>`)}${settingGroup("Danger zone", "Permanent deletion cannot be undone. Paid household owners must dissolve their household first.", `<label class="settings-field"><span>Type DELETE MY MUNCH ACCOUNT to confirm</span><input id="delete-account-confirmation" autocomplete="off" placeholder="DELETE MY MUNCH ACCOUNT"></label><div class="settings-actions"><button class="button button-danger" data-action="account-delete">Permanently delete account</button></div>`, "settings-danger")}</div>`,
    );
}

function morePage() {
    const items = [
        ["/app/insights", "Insights", "Patterns and progress", "↗"],
        ["/app/recipes", "Recipes", "Your structured recipe library", "◇"],
        ["/app/household", "Household", "Members and shared features", "⌂"],
        [
            "/app/settings",
            "Settings",
            "Profile, billing, connections and data",
            "⚙",
        ],
        ["/help", "Help", "Connection and product help", "?"],
    ];
    return `${sectionHeading("Munch", "More", "Everything that does not need a permanent spot in the mobile navigation.")}<div class="more-grid">${items.map(([href, title, description, icon]) => `<a class="more-card" href="${href}"><span class="more-icon" aria-hidden="true">${icon}</span><div><h3>${esc(title)}</h3><p>${esc(description)}</p></div><span class="settings-chevron" aria-hidden="true">›</span></a>`).join("")}</div>`;
}

function householdMemberCard(member, owner, seatPrice, androidFree) {
    const isOwner = member.role === "owner";
    const controls =
        owner && !isOwner
            ? `<div class="member-controls"><select aria-label="Role for ${esc(member.displayName)}" data-household-role="${esc(member.membershipId)}"><option value="member" ${member.role === "member" ? "selected" : ""}>Member · can edit shared data</option><option value="viewer" ${member.role === "viewer" ? "selected" : ""}>Viewer · read only</option></select><button class="button button-secondary button-small" data-action="household-role-save" data-membership-id="${esc(member.membershipId)}">Save role</button><button class="button button-quiet button-small" data-action="household-member-remove" data-membership-id="${esc(member.membershipId)}" data-member-name="${esc(member.displayName)}">Remove</button></div>`
            : "";
    const accessDescription = androidFree
        ? "Included on Android"
        : member.androidFreeAccess
          ? "Free through Android invitation"
          : isOwner
            ? "Included with Premium"
            : `+${seatPrice}/month household seat`;
    return `<article class="household-member"><div class="member-avatar" aria-hidden="true">${esc(member.displayName.slice(0, 1).toUpperCase())}</div><div class="member-copy"><div><strong>${esc(member.displayName)}</strong>${isOwner ? statusPill("Owner", "success") : statusPill(member.role, "neutral")}</div><small>${accessDescription} · joined ${esc(formatDateTime(member.joinedAt))}</small></div>${controls}</article>`;
}

async function householdPage(ctx) {
    const data = await ctx.api("/api/app/household/manage");
    const policy = requireProductPolicy(ctx.state.bootstrap);
    const premiumPrice = dollars(policy.premiumPriceMonthlyCents);
    const seatPrice = dollars(policy.householdMemberPriceMonthlyCents);
    const androidFree =
        Boolean(window.MunchAds) &&
        data.entitlementSource === "android_free_baseline";
    if (!data.household) {
        if (androidFree && data.canCreateHousehold === true) {
            return `${sectionHeading("Shared workspace", "Create a household", "Share recipes, meal plans and grocery lists while keeping personal nutrition records private.")}<div class="household-hero-grid"><section class="settings-group"><header><h3>Start your household</h3><p>Household sharing is included on Android. Inviting members does not add a charge.</p></header><form id="household-create-form" class="settings-group-body"><label class="settings-field"><span>Household name</span><input name="name" maxlength="120" placeholder="The Smith household" required></label><label class="settings-field"><span>Your display name</span><input name="display_name" maxlength="80" placeholder="Michael" required></label><button class="button button-primary" type="submit">Create household</button></form></section><aside class="household-privacy-card"><span class="settings-card-label">Privacy boundary</span><h3>Shared by default</h3><p>Recipes, meal plans and grocery lists are collaborative for household members.</p><h3>Still personal</h3><p>Meals, macros, water, weight, goals and personal nutrition history remain private.</p></aside></div>`;
        }
        if (data.tier === "premium" && data.canCreateHousehold === true) {
            return `${sectionHeading("Shared workspace", "Create a household", "Share recipes, meal plans and grocery lists while keeping personal nutrition records private.")}<div class="household-hero-grid"><section class="settings-group"><header><h3>Start your household</h3><p>Your Premium account is included. Each additional active member is ${seatPrice}/month after they accept.</p></header><form id="household-create-form" class="settings-group-body"><label class="settings-field"><span>Household name</span><input name="name" maxlength="120" placeholder="The Smith household" required></label><label class="settings-field"><span>Your display name</span><input name="display_name" maxlength="80" placeholder="Michael" required></label><button class="button button-primary" type="submit">Create household</button></form></section><aside class="household-privacy-card"><span class="settings-card-label">Privacy boundary</span><h3>Shared by default</h3><p>Recipes, meal plans and grocery lists are collaborative for household members.</p><h3>Still personal</h3><p>Meals, macros, water, weight, goals and personal nutrition history remain private.</p></aside></div>`;
        }
        const householdMessage =
            data.tier === "premium"
                ? "Your current Premium subscription covers your personal features. Discounted household seats are currently available through Munch website billing."
                : `Premium owners can create a household and add additional members for ${seatPrice}/month each.`;
        return `<div class="settings-empty household-empty"><span class="more-icon" aria-hidden="true">⌂</span><h2>No household is connected</h2><p>${esc(householdMessage)}</p><a class="button button-primary" href="/app/settings/billing">View plan & billing</a></div>`;
    }
    const household = data.household;
    const owner = household.role === "owner";
    const activeNonOwnerCount = Number(data.activeNonOwnerCount || 0);
    const total =
        policy.premiumPriceMonthlyCents +
        policy.householdMemberPriceMonthlyCents * activeNonOwnerCount;
    const pending = data.pendingInvitations || [];
    const billing = androidFree
        ? ""
        : owner
          ? `<section class="household-billing-card"><div><span>Current household total</span><strong>${dollars(total)}<small>/month</small></strong><p>${premiumPrice} Premium + ${activeNonOwnerCount} active member seat${activeNonOwnerCount === 1 ? "" : "s"} × ${seatPrice}.</p></div>${data.seatCoverage ? statusPill("Billing in sync", "success") : statusPill("Billing reconciling", "warning")}</section>`
          : data.entitlementSource === "household_subscription"
            ? `<section class="household-billing-card"><div><span>Your plan</span><strong>Premium<small> through household</small></strong><p>The household owner pays ${seatPrice}/month for your seat. Leaving ends this household-provided Premium entitlement.</p></div>${statusPill("Seat active", "success")}</section>`
            : "";
    const invite =
        owner && data.canInvite
            ? `<section class="settings-group"><header><h3>Invite a household member</h3><p>${androidFree ? "Invitations do not add a charge on Android." : "Invitations are free. Billing changes only when the invited person accepts."}</p></header><form id="household-invite-form" class="settings-group-body"><div class="settings-form-grid"><label class="settings-field"><span>Email</span><input name="email" type="email" maxlength="320" required></label><label class="settings-field"><span>Role</span><select name="role"><option value="member">Member · can edit shared data</option><option value="viewer">Viewer · read only</option></select></label></div><div class="settings-savebar"><span class="settings-note">${androidFree ? "Household recipes, meal plans and grocery lists are shared. Personal nutrition records stay private." : "Accepted members receive full Premium and automatically share household recipes, meal plans and grocery lists."}</span><button class="button button-primary" type="submit">Send invitation</button></div></form>${pending.length ? `<div class="pending-invites"><h4>Pending invitations</h4>${pending.map((invite) => `<div class="pending-invite"><div><strong>${esc(invite.email)}</strong><small>${esc(invite.role)}${invite.androidFreeAccess ? " · Free Android access" : androidFree ? " · Paid seat applies on web" : ""} · expires ${esc(formatDateTime(invite.expiresAt))}</small></div>${statusPill("Pending", "neutral")}</div>`).join("")}</div>` : ""}</section>`
            : owner
              ? `<section class="settings-group"><header><h3>Invitations unavailable</h3><p>${androidFree ? "The household has reached its member limit." : "A directly paid Premium subscription is required before another discounted seat can be added."}</p></header></section>`
              : "";
    const danger = owner
        ? settingGroup(
              "Dissolve household",
              androidFree
                  ? "This permanently deletes shared household records. Each member's personal records remain with their account."
                  : "This removes all paid member seats and permanently deletes shared household records. Personal member records remain with each account.",
              `<label class="settings-field"><span>Type DISSOLVE HOUSEHOLD to confirm</span><input id="dissolve-household-confirmation" autocomplete="off" placeholder="DISSOLVE HOUSEHOLD"></label><div class="settings-actions"><button class="button button-danger" data-action="household-dissolve">Dissolve household</button></div>`,
              "settings-danger",
          )
        : settingGroup(
              "Leave household",
              androidFree
                  ? "Your personal Munch account and private nutrition history stay intact. Leaving removes your access to shared household records."
                  : "Your personal Munch account and private nutrition history stay intact. Household-provided Premium ends when you leave unless you also have your own active Premium subscription.",
              `<div class="settings-actions"><button class="button button-danger" data-action="household-leave">Leave household</button></div>`,
              "settings-danger",
          );
    const additionalSeatLimit = Math.max(0, policy.householdMemberLimit - 1);
    return `${sectionHeading("Shared workspace", household.householdName, `You appear as ${household.displayName}. Household collaboration is ${data.canWrite ? "active" : "read only"} for your role.`)}${billing}<div class="household-layout"><div class="household-primary"><section class="settings-group"><header><div class="household-section-title"><div><h3>Members</h3><p>${data.members.length} of ${policy.householdMemberLimit} household accounts</p></div>${statusPill(`${Math.max(0, additionalSeatLimit - activeNonOwnerCount)} ${androidFree ? "places" : "seats"} available`, "neutral")}</div></header><div class="household-member-list">${data.members.map((member) => householdMemberCard(member, owner, seatPrice, androidFree)).join("")}</div></section>${invite}${danger}</div><aside class="household-sidebar"><section class="household-privacy-card"><span class="settings-card-label">Always shared</span><h3>Collaborative household</h3><ul><li>Household recipes</li><li>Meal plans and calendar</li><li>Grocery lists</li></ul><span class="settings-card-label spacer-top">Always private</span><ul><li>Personal meal history</li><li>Macros and goals</li><li>Water and weight</li><li>Personal saved foods</li></ul><a class="text-link" href="/privacy#households">Review household privacy →</a></section><a class="button button-secondary household-billing-link" href="/app/settings/billing">Plan & billing</a></aside></div>`;
}

function hydrateTimezoneSelect() {
    const select = document.getElementById("settings-timezone");
    if (!(select instanceof HTMLSelectElement)) return;
    const current = select.dataset.currentTimezone || "UTC";
    let zones = [];
    try {
        zones = Intl.supportedValuesOf("timeZone");
    } catch {
        zones = [
            "UTC",
            "America/New_York",
            "America/Chicago",
            "America/Denver",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Paris",
            "Asia/Tokyo",
            "Australia/Sydney",
        ];
    }
    if (!zones.includes(current)) zones.unshift(current);
    select.innerHTML = zones
        .map(
            (zone) =>
                `<option value="${esc(zone)}" ${zone === current ? "selected" : ""}>${esc(zone.replaceAll("_", " "))}</option>`,
        )
        .join("");
}

export async function renderAccountRoute(route, ctx) {
    if (route === "more") {
        ctx.content.innerHTML = morePage();
        return;
    }
    if (route === "household") {
        ctx.setLoading("Loading household…");
        ctx.content.innerHTML = await householdPage(ctx);
        return;
    }
    ctx.setLoading("Loading settings…");
    const data = await ctx.api("/api/app/settings");
    if (route === "settings") ctx.content.innerHTML = settingsIndex(data);
    if (route === "settings-profile") ctx.content.innerHTML = profilePage(data);
    if (route === "settings-goals") ctx.content.innerHTML = goalsPage(data);
    if (route === "settings-goals") {
        const [review, history] = await Promise.all([
            ctx.api("/api/app/guidance/goals/review", { keepPrevious: true }),
            ctx.api("/api/app/guidance/goals/history?limit=10", {
                keepPrevious: true,
            }),
        ]);
        const panel = ctx.content.querySelector("#goal-guidance-review");
        if (panel) {
            const historyRows = (history || [])
                .map((revision) => {
                    const targets = revision.targets || {};
                    const setTargets = Object.entries(targets).filter(
                        ([, value]) => value != null,
                    ).length;
                    return `<div class="food-row"><div><strong>Revision ${esc(revision.revision)} · ${esc(revision.objective)}</strong><small>${esc(new Date(revision.created_at).toLocaleDateString())} · ${setTargets} targets · ${esc(revision.origin)}</small></div><span>${revision.confirmed ? "Confirmed" : "Pending"}</span></div>`;
                })
                .join("");
            panel.innerHTML = `<div class="panel-title"><div><h3>Goal review</h3><span>${esc(review.status.replaceAll("_", " "))}</span></div><span class="source-chip source-saved">${esc(review.objective)}</span></div><p>${esc(review.rationale)}</p><p class="tiny">Recent evidence: ${esc(review.evidence.logged_nutrition_days)} logged nutrition days and ${esc(review.evidence.weight_measurements)} weight measurements across ${esc(review.evidence.weight_measurement_span_days)} days.</p><p class="tiny">Munch does not prescribe numeric targets. You can review your own changes above; each confirmed update is recorded below.</p><div class="spacer-top">${historyRows || `<p class="tiny">No goal revisions recorded yet.</p>`}</div>`;
        }
    }
    if (route === "settings-billing")
        ctx.content.innerHTML = await billingPage(data, ctx);
    if (route === "settings-connections")
        ctx.content.innerHTML = connectionsPage(data);
    if (route === "settings-data") ctx.content.innerHTML = dataPage(data);
    if (route === "settings-account") ctx.content.innerHTML = accountPage(data);
    hydrateTimezoneSelect();
}

function saveStatus(form, message) {
    const status = form.querySelector(".settings-save-status");
    if (status) status.textContent = message;
}

export async function handleAccountSubmit(form, ctx) {
    if (form.id === "settings-profile-form") {
        const values = Object.fromEntries(new FormData(form));
        const body = {
            timezone: values.timezone,
            preferred_weight_unit: values.preferred_weight_unit || null,
            widgets_enabled: form.elements.widgets_enabled?.checked === true,
            alcohol_tracking_enabled:
                form.elements.alcohol_tracking_enabled?.checked === true,
            preferred_drink_unit: values.preferred_drink_unit || null,
        };
        const submit = form.querySelector("button[type='submit']");
        if (submit) submit.disabled = true;
        try {
            await ctx.api("/api/app/preferences", {
                method: "PUT",
                body: JSON.stringify(body),
                keepPrevious: true,
            });
            ctx.state.bootstrap = null;
            saveStatus(form, "Saved");
            ctx.toast("Preferences saved.");
        } finally {
            if (submit) submit.disabled = false;
        }
        return true;
    }
    if (form.id === "settings-goals-form") {
        const values = Object.fromEntries(new FormData(form));
        const submit = form.querySelector("button[type='submit']");
        if (submit) submit.disabled = true;
        try {
            const weight =
                values.target_weight === ""
                    ? null
                    : Number(values.target_weight);
            const weightUnit = values.unit === "lb" ? "lb" : "kg";
            const targets = Object.fromEntries(
                [
                    "daily_calories",
                    "daily_protein_g",
                    "daily_carbs_g",
                    "daily_fat_g",
                    "daily_fiber_g",
                    "daily_sugar_g",
                    "daily_alcohol_g",
                    "daily_water_ml",
                ].map((key) => [
                    key,
                    values[key] === "" ? null : Number(values[key]),
                ]),
            );
            targets.target_weight_g =
                weight == null
                    ? null
                    : Math.round(
                          weight * (weightUnit === "lb" ? 453.59237 : 1000),
                      );
            const preview = await ctx.api("/api/app/guidance/goals/preview", {
                method: "POST",
                body: JSON.stringify({
                    targets,
                    idempotency_key: crypto.randomUUID(),
                }),
                keepPrevious: true,
            });
            ctx.state.goalPreview = preview;
            const previewPanel = ctx.content.querySelector(
                "#goal-change-preview",
            );
            if (previewPanel) {
                const current = preview.current_revision?.targets || {};
                const proposed = preview.proposed_targets || targets;
                const labels = {
                    daily_calories: "Calories",
                    daily_protein_g: "Protein",
                    daily_carbs_g: "Carbohydrates",
                    daily_fat_g: "Fat",
                    daily_fiber_g: "Fiber",
                    daily_sugar_g: "Sugar",
                    daily_alcohol_g: "Alcohol",
                    daily_water_ml: "Water",
                    target_weight_g: "Target weight",
                };
                const changes = Object.keys(labels)
                    .filter((key) => current[key] !== proposed[key])
                    .map(
                        (key) =>
                            `<tr><th>${esc(labels[key])}</th><td>${current[key] == null ? "No target" : esc(current[key])}</td><td>${proposed[key] == null ? "No target" : esc(proposed[key])}</td></tr>`,
                    )
                    .join("");
                previewPanel.innerHTML = `<div class="panel-title"><div><h3>Review target changes</h3><span>Current and proposed values</span></div></div>${changes ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Target</th><th>Current</th><th>Proposed</th></tr></thead><tbody>${changes}</tbody></table></div>` : `<p>No target values changed.</p>`}<button class="button button-primary spacer-top" type="button" data-action="confirm-goal-change" ${changes ? "" : "disabled"}>Confirm target changes</button>`;
            }
            saveStatus(form, "Preview ready");
        } finally {
            if (submit) submit.disabled = false;
        }
        return true;
    }
    if (form.id === "household-create-form") {
        const values = Object.fromEntries(new FormData(form));
        const submit = form.querySelector("button[type='submit']");
        if (submit) submit.disabled = true;
        try {
            await ctx.api("/account/household/create", {
                method: "POST",
                body: JSON.stringify({
                    name: values.name,
                    display_name: values.display_name,
                }),
                keepPrevious: true,
            });
            ctx.toast("Household created.");
            await ctx.renderRoute();
        } finally {
            if (submit) submit.disabled = false;
        }
        return true;
    }
    if (form.id === "household-invite-form") {
        const values = Object.fromEntries(new FormData(form));
        const submit = form.querySelector("button[type='submit']");
        if (submit) submit.disabled = true;
        try {
            await ctx.api("/account/household/invite", {
                method: "POST",
                body: JSON.stringify({
                    email: values.email,
                    role: values.role,
                }),
                keepPrevious: true,
            });
            ctx.toast(
                "Invitation sent. Billing changes only if it is accepted.",
            );
            form.reset();
            await ctx.renderRoute();
        } finally {
            if (submit) submit.disabled = false;
        }
        return true;
    }
    return false;
}

export async function handleAccountAction(button, ctx) {
    const action = button.dataset.action;
    if (action === "ad-privacy-options") {
        try {
            const result = await window.MunchAds?.showPrivacyOptions();
            if (result?.available === false) {
                ctx.toast(
                    "No additional advertising privacy choices are required for this location.",
                );
            }
        } catch {
            ctx.toast(
                "Advertising privacy choices could not be opened. Try again later.",
                "error",
            );
        }
        return true;
    }
    if (action === "billing-play-manage") {
        window.open(
            "https://play.google.com/store/account/subscriptions",
            "_blank",
            "noopener,noreferrer",
        );
        return true;
    }
    if (action === "connection-revoke") {
        const name = button.dataset.clientName || "this connection";
        if (!confirm(`Revoke ${name}?`)) return true;
        await ctx.api(
            `/api/app/connections/${encodeURIComponent(button.dataset.tokenFamilyId || "")}`,
            { method: "DELETE", keepPrevious: true },
        );
        ctx.toast("Connection revoked.");
        await ctx.renderRoute();
        return true;
    }
    if (action === "export-account") {
        const data = await ctx.api("/api/app/export", {
            method: "POST",
            body: "{}",
            keepPrevious: true,
        });
        if (!data.url) throw new Error("No export was available");
        location.href = data.url;
        return true;
    }
    if (action === "export-meals") {
        const data = await ctx.api("/api/app/export/meals", {
            method: "POST",
            body: "{}",
            keepPrevious: true,
        });
        if (!data.url) {
            ctx.toast("No meals are available to export yet.", "error");
            return true;
        }
        location.href = data.url;
        return true;
    }
    if (action === "account-delete") {
        const confirmation =
            document.getElementById("delete-account-confirmation")?.value || "";
        if (confirmation !== "DELETE MY MUNCH ACCOUNT") {
            ctx.toast(
                "Type the confirmation phrase exactly before deleting your account.",
                "error",
            );
            return true;
        }
        if (
            !confirm(
                "Permanently delete your Munch account and personal data? This cannot be undone.",
            )
        )
            return true;
        await ctx.api("/account/portal/delete", {
            method: "POST",
            body: JSON.stringify({ confirmation }),
            keepPrevious: true,
        });
        location.href = "/?deleted=1";
        return true;
    }
    if (action === "household-role-save") {
        const id = button.dataset.membershipId || "";
        const select = document.querySelector(
            `[data-household-role="${CSS.escape(id)}"]`,
        );
        await ctx.api("/account/household/member/role", {
            method: "POST",
            body: JSON.stringify({ membership_id: id, role: select?.value }),
            keepPrevious: true,
        });
        ctx.toast("Member role updated.");
        await ctx.renderRoute();
        return true;
    }
    if (action === "household-member-remove") {
        const name = button.dataset.memberName || "this member";
        if (
            !confirm(
                `Remove ${name}? Their household-provided Premium ends and your billed seat quantity will decrease.`,
            )
        )
            return true;
        await ctx.api("/account/household/member/remove", {
            method: "POST",
            body: JSON.stringify({
                membership_id: button.dataset.membershipId,
            }),
            keepPrevious: true,
        });
        ctx.toast("Member removed and household billing updated.");
        await ctx.renderRoute();
        return true;
    }
    if (action === "household-leave") {
        if (
            !confirm(
                "Leave this household? Household-provided Premium ends immediately unless you also have your own Premium subscription.",
            )
        )
            return true;
        await ctx.api("/account/household/leave", {
            method: "POST",
            body: JSON.stringify({ confirm: true }),
            keepPrevious: true,
        });
        ctx.toast("You left the household.");
        ctx.state.bootstrap = null;
        await ctx.renderRoute();
        return true;
    }
    if (action === "household-dissolve") {
        const confirmation =
            document.getElementById("dissolve-household-confirmation")?.value ||
            "";
        if (confirmation !== "DISSOLVE HOUSEHOLD") {
            ctx.toast(
                "Type DISSOLVE HOUSEHOLD exactly before dissolving the household.",
                "error",
            );
            return true;
        }
        if (
            !confirm(
                "Dissolve this household, remove all paid member seats and permanently delete shared household records?",
            )
        )
            return true;
        await ctx.api("/account/household/dissolve", {
            method: "POST",
            body: JSON.stringify({ confirmation }),
            keepPrevious: true,
        });
        ctx.toast("Household dissolved and paid member seats removed.");
        ctx.state.bootstrap = null;
        await ctx.renderRoute();
        return true;
    }
    return false;
}
