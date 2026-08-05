#!/usr/bin/env bun

const forbidden = [
    "nutrition-mcp.com",
    "googletagmanager",
    "google-analytics.com",
    "Patreon",
    "your-domain.com",
    "anton@nutrition-mcp.com",
];

const allowedPaths = new Set(["LICENSE", "NOTICE.md", "README.md"]);

// The upstream-attribution line in the homepage footer links to the original
// project, so the bare domain is allowed there — and only there.
const allowedValues = new Map([["public/index.html", ["nutrition-mcp.com"]]]);

const roots = ["public", "src"];
const failures: string[] = [];

for (const root of roots) {
    const glob = new Bun.Glob("**/*.{html,css,js,ts,txt,xml,json}");
    for await (const relative of glob.scan({ cwd: root })) {
        const path = `${root}/${relative}`;
        if (allowedPaths.has(path)) continue;
        const text = await Bun.file(path).text();
        for (const value of forbidden) {
            if (allowedValues.get(path)?.includes(value)) continue;
            if (text.includes(value)) failures.push(`${path}: ${value}`);
        }
    }
}

if (failures.length > 0) {
    console.error(
        "Forbidden public brand strings found:\n" + failures.join("\n"),
    );
    process.exit(1);
}

console.log("Munch public brand check passed.");
