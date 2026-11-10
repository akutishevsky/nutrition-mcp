#!/usr/bin/env bun

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const output = ".mobile-web";

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp("public", output, { recursive: true });

let appHtml = await readFile("public/app.html", "utf8");
appHtml = appHtml.replaceAll('href="/app/pantry"', 'href="/pantry.html"');
appHtml = appHtml.replace(
    /<script type="module" src="\/app-integrity\.js"><\/script>\s*<script type="module" src="\/app\.js"><\/script>\s*<script type="module" src="\/app-patches\.js"><\/script>/,
    '<script type="module" src="/mobile-entry.js"></script>',
);
if (!appHtml.includes("/mobile-entry.js")) {
    throw new Error("Mobile app shell script injection failed");
}
await writeFile(join(output, "index.html"), appHtml);

for (const file of ["app.js", "pantry.js"]) {
    const path = join(output, file);
    const source = await readFile(path, "utf8");
    const migrated = source.replace(
        'from "./app-api.js"',
        'from "./mobile-runtime.js"',
    );
    if (migrated === source) {
        throw new Error(
            `${file} no longer imports the shared application transport`,
        );
    }
    await writeFile(path, migrated);
}

let pantryHtml = await readFile(join(output, "pantry.html"), "utf8");
pantryHtml = pantryHtml
    .replaceAll('href="/app"', 'href="/index.html?route=%2Fapp"')
    .replaceAll(
        'href="/app/recipes"',
        'href="/index.html?route=%2Fapp%2Frecipes"',
    )
    .replaceAll('href="/app/plan"', 'href="/index.html?route=%2Fapp%2Fplan"')
    .replace(
        '<script type="module" src="/pantry.js"></script>',
        '<script type="module" src="/pantry.js"></script>\n        <script type="module" src="/pantry-native.js"></script>',
    );
if (!pantryHtml.includes("/pantry-native.js")) {
    throw new Error("Native Pantry capture script injection failed");
}
await writeFile(join(output, "pantry.html"), pantryHtml);

await cp("mobile/mobile-entry.js", join(output, "mobile-entry.js"));
await cp("mobile/mobile-login.html", join(output, "mobile-login.html"));
await cp("mobile/mobile-login.js", join(output, "mobile-login.js"));
await cp("mobile/pantry-native.js", join(output, "pantry-native.js"));
await cp("mobile/billing-native.js", join(output, "billing-native.js"));
await cp("mobile/meal-photo-native.js", join(output, "meal-photo-native.js"));

const mobileEntry = await readFile("mobile/mobile-entry.js", "utf8");
if (!mobileEntry.includes("./meal-photo-native.js")) {
    throw new Error("Packaged entry lost the native meal-photo capture wiring");
}
if (!mobileEntry.includes('data-testid="offline-state"')) {
    throw new Error("Packaged entry lost the offline cold-start state");
}

const build = await Bun.build({
    entrypoints: ["mobile/runtime.js"],
    outdir: output,
    naming: "mobile-runtime.js",
    target: "browser",
    minify: false,
    sourcemap: "none",
});
if (!build.success) {
    throw new AggregateError(
        build.logs,
        "Unable to bundle installed-client runtime",
    );
}

const runtime = await readFile(join(output, "mobile-runtime.js"), "utf8");
if (!runtime.includes("https://munch.business")) {
    throw new Error("Installed-client runtime lost the canonical API origin");
}
if (!runtime.includes("MunchSecureSession")) {
    throw new Error("Installed-client runtime lost secure session integration");
}
if (!runtime.includes("MunchPlayBilling")) {
    throw new Error(
        "Installed-client runtime lost Google Play Billing integration",
    );
}
if (!runtime.includes("MunchAds")) {
    throw new Error(
        "Installed-client runtime lost native ad and privacy controls",
    );
}
if (!runtime.includes("CapacitorBarcodeScanner")) {
    throw new Error("Installed-client runtime lost native barcode integration");
}
if (!runtime.includes("takePhoto")) {
    throw new Error("Installed-client runtime lost native camera integration");
}

console.log("Built local mobile bundle in .mobile-web");
