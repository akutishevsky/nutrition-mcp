import { PRODUCT_CONFIG, formatMonthlyPrice } from "../src/product-config.js";

const errors: string[] = [];

function normalizedText(source: string): string {
    return source
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

if (!PRODUCT_CONFIG.trialEnabled) {
    errors.push(
        "PRODUCT_CONFIG.trialEnabled must remain true (the 7-day free trial is live on the Stripe price)",
    );
}
if (!PRODUCT_CONFIG.freeTierEnabled) {
    errors.push("The permanent Free tier must remain enabled");
}

// The 7-day free trial is a settled product fact (PRODUCT.md, ruled
// 2026-11-09: "The 7-day free trial and the permanent free tier are
// unchanged"). The trial lives on the Stripe price, so checkout code
// still never sets trial params, and PRODUCT_CONFIG.trialEnabled is
// true because the trial is real. The two Persuade marketing surfaces
// — the homepage and /connect — may state that fact; trial language
// stays forbidden on every other public page (app, auth, help, legal).
const trialFactSurfaces = new Set(["public/index.html", "public/connect.html"]);

const publicHtml = new Bun.Glob("public/**/*.html");
for await (const path of publicHtml.scan({ cwd: "." })) {
    const source = await Bun.file(path).text();
    if (
        !trialFactSurfaces.has(path) &&
        /\btrial\b/i.test(normalizedText(source))
    ) {
        errors.push(`${path}: contains user-facing trial language`);
    }
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(source)) {
        errors.push(`${path}: contains an invalid control character`);
    }
}

const stripeClient = await Bun.file("src/billing/stripe-client.ts").text();
for (const forbidden of [
    "trial_period_days",
    "MUNCH_TRIAL_DAYS",
    "trialDays",
]) {
    if (stripeClient.includes(forbidden)) {
        errors.push(`Stripe checkout still contains ${forbidden}`);
    }
}

const terms = normalizedText(await Bun.file("public/terms.html").text());
for (const required of [
    "permanent core access",
    "optional subscription",
    formatMonthlyPrice(),
    "support@munch.business",
    "State of South Carolina",
]) {
    if (!terms.includes(required)) {
        errors.push(`Terms are missing required text: ${required}`);
    }
}

const privacy = normalizedText(await Bun.file("public/privacy.html").text());
for (const required of [
    "10 minutes",
    "30 days",
    "5 minutes",
    "15 minutes",
    "90 days",
    "one hour",
    "Contact",
    "support@munch.business",
    "security@munch.business",
]) {
    if (!privacy.includes(required)) {
        errors.push(
            `Privacy Policy is missing retention/contact text: ${required}`,
        );
    }
}

const help = normalizedText(await Bun.file("public/help.html").text());
for (const required of ["Report a problem", "support@munch.business"]) {
    if (!help.includes(required)) {
        errors.push(`Help page is missing required support text: ${required}`);
    }
}

const environmentExample = await Bun.file(".env.example").text();
if (!/^OPENAI_APPS_CHALLENGE=$/m.test(environmentExample)) {
    errors.push(".env.example must document OPENAI_APPS_CHALLENGE");
}

if (errors.length > 0) {
    console.error("Policy consistency check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log("Policy consistency check passed.");
