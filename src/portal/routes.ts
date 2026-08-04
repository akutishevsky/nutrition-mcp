import { Hono } from "hono";
import { decideEntitlement } from "../billing/entitlements.js";
import { getSubscriptionSnapshot } from "../billing/repository.js";
import { requireSameOrigin } from "../accounts/csrf.js";
import { clearWebSession, requireWebSession } from "../accounts/session.js";
import { exportMeals, getRailwayExportFile } from "../export.js";
import { listSavedFoods } from "../saved-foods/repository.js";
import { deleteAllUserData, getProfile, upsertProfile } from "../supabase.js";
import { listOAuthConnections, revokeOAuthConnection } from "./repository.js";

function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function isTimezone(value: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
        return true;
    } catch {
        return false;
    }
}

function page(input: {
    email: string;
    subscriptionStatus: string;
    accessAllowed: boolean;
    timezone: string;
    weightUnit: string | null;
    drinkUnit: string | null;
    widgetsEnabled: boolean;
    alcoholEnabled: boolean;
    connections: Array<{
        tokenFamilyId: string;
        clientName: string | null;
        clientId: string;
        expiresAt: string;
    }>;
    savedFoods: Array<{ id: string; label: string; useCount: number }>;
}): string {
    const connections = input.connections.length
        ? input.connections
              .map(
                  (connection) =>
                      `<li><div><strong>${escapeHtml(connection.clientName ?? "ChatGPT / MCP client")}</strong><small>${escapeHtml(connection.clientId)} · expires ${escapeHtml(connection.expiresAt)}</small></div><button class="button button-quiet button-small" data-revoke="${escapeHtml(connection.tokenFamilyId)}">Revoke</button></li>`,
              )
              .join("")
        : "<li><div><strong>No active connections</strong><small>Connect Munch from ChatGPT to see it here.</small></div></li>";
    const savedFoods = input.savedFoods.length
        ? input.savedFoods
              .map(
                  (food) =>
                      `<li><div><strong>${escapeHtml(food.label)}</strong><small>used ${food.useCount} times</small></div></li>`,
              )
              .join("")
        : "<li><div><strong>No saved foods yet</strong><small>Ask ChatGPT to save a food or recurring meal.</small></div></li>";

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0B8F4D"><title>Munch account</title><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/styles.css"></head><body class="portal-page"><header class="portal-header"><div class="container portal-header-inner"><a class="brand" href="/"><img class="brand-logo" src="/brand/munch-mark-white.svg" alt=""><span>Munch</span></a><button class="button button-quiet button-small" id="logout">Sign out</button></div></header><main class="portal-main"><div class="container"><div class="portal-welcome"><div><p class="section-kicker">Account control center</p><h1>Your Munch account</h1><p>${escapeHtml(input.email)}</p></div><span class="status-pill">${escapeHtml(input.subscriptionStatus)}${input.accessAllowed ? " · ChatGPT access active" : " · access limited"}</span></div><p id="message" class="message-bar" role="status"></p><div class="portal-grid"><section class="portal-card wide"><h2>ChatGPT connections</h2><p>Authorized clients can call Munch nutrition tools. Revoke anything you no longer recognize or use.</p><ul class="portal-list">${connections}</ul></section><section class="portal-card"><h2>Billing</h2><p>One plan: $4.99/month after the seven-day trial. Stripe hosts payment methods, invoices, cancellation, and subscription changes.</p><div class="portal-actions"><button class="button button-primary" id="billing">Manage billing in Stripe</button></div></section><section class="portal-card"><h2>Your data</h2><p>Download your meal history or manage saved foods conversationally through ChatGPT.</p><ul class="portal-list">${savedFoods}</ul><div class="portal-actions"><button class="button button-secondary" id="export">Export meal history</button></div></section><section class="portal-card wide"><h2>Preferences</h2><form id="preferences" class="portal-form"><div class="field"><label for="timezone">Timezone</label><input id="timezone" name="timezone" value="${escapeHtml(input.timezone)}" required></div><div class="field"><label for="weight-unit">Weight unit</label><select id="weight-unit" name="preferred_weight_unit"><option value="">No preference</option><option value="kg"${input.weightUnit === "kg" ? " selected" : ""}>kg</option><option value="lb"${input.weightUnit === "lb" ? " selected" : ""}>lb</option></select></div><label class="checkbox-row"><input type="checkbox" name="widgets_enabled"${input.widgetsEnabled ? " checked" : ""}> Show interactive widgets</label><label class="checkbox-row"><input type="checkbox" name="alcohol_tracking_enabled"${input.alcoholEnabled ? " checked" : ""}> Enable alcohol tracking</label><div class="field"><label for="drink-unit">Drink units</label><select id="drink-unit" name="preferred_drink_unit"><option value="">Default</option><option value="us"${input.drinkUnit === "us" ? " selected" : ""}>US</option><option value="uk"${input.drinkUnit === "uk" ? " selected" : ""}>UK</option></select></div><button class="button button-primary" type="submit">Save preferences</button></form></section><section class="portal-card wide danger"><h2>Delete account</h2><p>This permanently deletes the account, nutrition history, saved foods, drafts, and active connections. Stripe billing should be cancelled separately before deletion.</p><div class="portal-form"><div class="field"><label for="delete-confirmation">Type DELETE MY MUNCH ACCOUNT</label><input id="delete-confirmation" autocomplete="off"></div><button class="button button-danger" id="delete-account">Permanently delete account</button></div></section></div></div></main><script>
const message=document.getElementById('message');
async function post(url,body={}){const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Request failed');return data}
function show(text){message.textContent=text}
document.getElementById('preferences').addEventListener('submit',async(event)=>{event.preventDefault();const form=new FormData(event.currentTarget);try{await post('/account/portal/preferences',{timezone:form.get('timezone'),preferred_weight_unit:form.get('preferred_weight_unit')||null,widgets_enabled:form.has('widgets_enabled'),alcohol_tracking_enabled:form.has('alcohol_tracking_enabled'),preferred_drink_unit:form.get('preferred_drink_unit')||null});show('Preferences saved.')}catch(error){show(error.message)}});
document.querySelectorAll('[data-revoke]').forEach(button=>button.addEventListener('click',async()=>{try{await post('/account/portal/connections/revoke',{token_family_id:button.dataset.revoke});button.closest('li').remove();show('Connection revoked.')}catch(error){show(error.message)}}));
document.getElementById('billing').addEventListener('click',async()=>{try{const data=await post('/billing/portal');location.href=data.url}catch(error){show(error.message)}});
document.getElementById('export').addEventListener('click',async()=>{try{const data=await post('/account/portal/export');if(data.url)location.href=data.url;else show('There are no meals to export.')}catch(error){show(error.message)}});
document.getElementById('logout').addEventListener('click',async()=>{try{await post('/account/logout');location.href='/'}catch(error){show(error.message)}});
document.getElementById('delete-account').addEventListener('click',async()=>{try{await post('/account/portal/delete',{confirmation:document.getElementById('delete-confirmation').value});location.href='/?deleted=1'}catch(error){show(error.message)}});
</script></body></html>`;
}

export function createPortalRouter(): Hono {
    const portal = new Hono();

    portal.use("*", async (c, next) => {
        await next();
        c.header("Cache-Control", "private, no-store");
        c.header("Pragma", "no-cache");
    });

    portal.get("/account/portal", requireWebSession, async (c) => {
        const userId = c.get("munchUserId");
        const [subscription, profile, connections, savedFoods] =
            await Promise.all([
                getSubscriptionSnapshot(userId),
                getProfile(userId),
                listOAuthConnections(userId),
                listSavedFoods(userId, 20),
            ]);
        const entitlement = decideEntitlement(subscription);
        return c.html(
            page({
                email: c.get("munchUserEmail"),
                subscriptionStatus: subscription?.status ?? "not subscribed",
                accessAllowed: entitlement.allowMcp,
                timezone: profile?.timezone ?? "UTC",
                weightUnit: profile?.preferred_weight_unit ?? null,
                drinkUnit: profile?.preferred_drink_unit ?? null,
                widgetsEnabled: profile?.widgets_enabled ?? true,
                alcoholEnabled: profile?.alcohol_tracking_enabled ?? false,
                connections,
                savedFoods: savedFoods.map((food) => ({
                    id: food.id,
                    label: food.label,
                    useCount: food.useCount,
                })),
            }),
        );
    });

    portal.post(
        "/account/portal/preferences",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            const body = (await c.req.json()) as Record<string, unknown>;
            const timezone =
                typeof body.timezone === "string" ? body.timezone.trim() : "";
            if (!timezone || !isTimezone(timezone)) {
                return c.json({ error: "invalid_timezone" }, 400);
            }
            const weightUnit = body.preferred_weight_unit;
            const drinkUnit = body.preferred_drink_unit;
            if (
                weightUnit !== null &&
                weightUnit !== "kg" &&
                weightUnit !== "lb"
            ) {
                return c.json({ error: "invalid_weight_unit" }, 400);
            }
            if (
                drinkUnit !== null &&
                drinkUnit !== "us" &&
                drinkUnit !== "uk"
            ) {
                return c.json({ error: "invalid_drink_unit" }, 400);
            }
            const profile = await upsertProfile(c.get("munchUserId"), {
                timezone,
                preferred_weight_unit: weightUnit,
                widgets_enabled: body.widgets_enabled === true,
                alcohol_tracking_enabled:
                    body.alcohol_tracking_enabled === true,
                preferred_drink_unit: drinkUnit,
            });
            return c.json({ saved: true, profile });
        },
    );

    portal.post(
        "/account/portal/connections/revoke",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            const body = (await c.req.json()) as {
                token_family_id?: unknown;
            };
            if (typeof body.token_family_id !== "string") {
                return c.json({ error: "token_family_id_required" }, 400);
            }
            const revoked = await revokeOAuthConnection(
                c.get("munchUserId"),
                body.token_family_id,
            );
            return c.json({ revoked });
        },
    );

    portal.post(
        "/account/portal/export",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            const result = await exportMeals(c.get("munchUserId"));
            return c.json(result);
        },
    );

    portal.post(
        "/account/portal/delete",
        requireSameOrigin,
        requireWebSession,
        async (c) => {
            const body = (await c.req.json()) as { confirmation?: unknown };
            if (body.confirmation !== "DELETE MY MUNCH ACCOUNT") {
                return c.json({ error: "confirmation_mismatch" }, 400);
            }
            const userId = c.get("munchUserId");
            await deleteAllUserData(userId);
            await clearWebSession(c);
            return c.json({ deleted: true });
        },
    );

    portal.get("/exports/download", async (c) => {
        c.set("suppressAccessLog", true);
        const token = c.req.query("token");
        if (!token) return c.json({ error: "export_token_required" }, 400);
        const file = await getRailwayExportFile(token);
        if (!file) return c.json({ error: "invalid_or_expired_export" }, 404);
        const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        return c.body(file.content, 200, {
            "Content-Type": file.contentType,
            "Content-Disposition": `attachment; filename="${safeName}"`,
            "Cache-Control": "private, no-store",
            Pragma: "no-cache",
            "X-Content-Type-Options": "nosniff",
        });
    });

    return portal;
}
