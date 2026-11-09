#!/usr/bin/env bun

/**
 * S0 (Full Parity App Program): APK size budget + bundle-content gate.
 *
 * Reads the assembled debug APK as a zip (central directory only — no
 * external tools), asserts the packaged .mobile-web bundle and native
 * code are actually inside, enforces a byte budget, and writes a report
 * (JSON + Markdown) that the Android validate job uploads as an artifact.
 *
 * Usage:
 *   bun scripts/android-apk-report.ts [apkPath] [reportDir]
 * Budget override: MUNCH_ANDROID_APK_BUDGET_BYTES (bytes).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const apkPath =
    process.argv[2] ?? "android/app/build/outputs/apk/debug/app-debug.apk";
const reportDir = process.argv[3] ?? "apk-size-report";
// Baseline guard, tightened against the measured CI size in the S0 PR.
// Debug APKs carry unstripped native libraries and the ML Kit barcode
// model, so this is a tripwire against accidental bloat (a second copy
// of the web bundle, a stray dependency), not a store-size target.
const budgetBytes = Number(
    process.env.MUNCH_ANDROID_APK_BUDGET_BYTES ?? 64 * 1024 * 1024,
);

interface ZipEntry {
    name: string;
    compressedSize: number;
    uncompressedSize: number;
}

function readZipEntries(buffer: Buffer): ZipEntry[] {
    // End Of Central Directory record: scan backwards for 0x06054b50.
    let eocd = -1;
    for (
        let i = buffer.length - 22;
        i >= Math.max(0, buffer.length - 22 - 65536);
        i--
    ) {
        if (buffer.readUInt32LE(i) === 0x06054b50) {
            eocd = i;
            break;
        }
    }
    if (eocd < 0) throw new Error("APK is not a readable zip (no EOCD record)");
    const count = buffer.readUInt16LE(eocd + 10);
    let offset = buffer.readUInt32LE(eocd + 16);
    const entries: ZipEntry[] = [];
    for (let n = 0; n < count; n++) {
        if (buffer.readUInt32LE(offset) !== 0x02014b50) {
            throw new Error("APK central directory is corrupt");
        }
        const nameLength = buffer.readUInt16LE(offset + 28);
        const extraLength = buffer.readUInt16LE(offset + 30);
        const commentLength = buffer.readUInt16LE(offset + 32);
        entries.push({
            name: buffer
                .subarray(offset + 46, offset + 46 + nameLength)
                .toString("utf8"),
            compressedSize: buffer.readUInt32LE(offset + 20),
            uncompressedSize: buffer.readUInt32LE(offset + 24),
        });
        offset += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
}

const apk = await readFile(apkPath);
const entries = readZipEntries(apk);
const names = new Set(entries.map((entry) => entry.name));

const requiredEntries = [
    "AndroidManifest.xml",
    "assets/public/index.html",
    "assets/public/pantry.html",
    "assets/public/mobile-runtime.js",
    "assets/public/mobile-entry.js",
];
const failures: string[] = [];
for (const required of requiredEntries) {
    if (!names.has(required)) {
        failures.push(`APK is missing required bundle entry: ${required}`);
    }
}
if (![...names].some((name) => /^classes\d*\.dex$/.test(name))) {
    failures.push("APK contains no classes*.dex (native code missing)");
}
if (apk.byteLength > budgetBytes) {
    failures.push(
        `APK size ${apk.byteLength} exceeds budget ${budgetBytes} bytes`,
    );
}

function sumWhere(predicate: (name: string) => boolean): number {
    return entries
        .filter((entry) => predicate(entry.name))
        .reduce((total, entry) => total + entry.uncompressedSize, 0);
}

const report = {
    apk: basename(apkPath),
    sizeBytes: apk.byteLength,
    sizeMiB: Number((apk.byteLength / (1024 * 1024)).toFixed(2)),
    budgetBytes,
    budgetMiB: Number((budgetBytes / (1024 * 1024)).toFixed(2)),
    withinBudget: apk.byteLength <= budgetBytes,
    entryCount: entries.length,
    uncompressedBytes: {
        dex: sumWhere((name) => /^classes\d*\.dex$/.test(name)),
        nativeLibraries: sumWhere((name) => name.startsWith("lib/")),
        packagedWebBundle: sumWhere((name) =>
            name.startsWith("assets/public/"),
        ),
        resources: sumWhere((name) => name.startsWith("res/")),
    },
    requiredEntries: Object.fromEntries(
        requiredEntries.map((name) => [name, names.has(name)]),
    ),
    failures,
};

await mkdir(reportDir, { recursive: true });
await writeFile(
    join(reportDir, "apk-size-report.json"),
    JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
    join(reportDir, "apk-size-report.md"),
    [
        `# APK size report — ${report.apk}`,
        "",
        `- Size: **${report.sizeMiB} MiB** (${report.sizeBytes} bytes)`,
        `- Budget: ${report.budgetMiB} MiB — ${report.withinBudget ? "within budget" : "OVER BUDGET"}`,
        `- Entries: ${report.entryCount}`,
        `- Uncompressed dex: ${(report.uncompressedBytes.dex / (1024 * 1024)).toFixed(2)} MiB`,
        `- Uncompressed native libraries: ${(report.uncompressedBytes.nativeLibraries / (1024 * 1024)).toFixed(2)} MiB`,
        `- Uncompressed packaged web bundle (assets/public): ${(report.uncompressedBytes.packagedWebBundle / (1024 * 1024)).toFixed(2)} MiB`,
        "",
        "Required bundle entries:",
        ...requiredEntries.map(
            (name) => `- ${names.has(name) ? "✓" : "✗ MISSING"} ${name}`,
        ),
        ...(failures.length
            ? ["", "Failures:", ...failures.map((failure) => `- ${failure}`)]
            : []),
        "",
    ].join("\n"),
);

console.log(
    `APK ${report.apk}: ${report.sizeMiB} MiB (budget ${report.budgetMiB} MiB), ${report.entryCount} entries, packaged web bundle ${(report.uncompressedBytes.packagedWebBundle / (1024 * 1024)).toFixed(2)} MiB uncompressed.`,
);
if (failures.length) {
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}
