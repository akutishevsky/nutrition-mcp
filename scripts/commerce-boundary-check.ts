import {
    PROTECTED_COMMERCE_PATHS,
    PROTECTED_COMMERCE_TERMS,
} from "../src/product-config.js";

const root = new URL("../", import.meta.url);
const findings: string[] = [];

async function inspectFile(relativePath: string): Promise<void> {
    const file = Bun.file(new URL(relativePath, root));
    if (!(await file.exists())) return;
    const text = (await file.text()).toLowerCase();
    for (const term of PROTECTED_COMMERCE_TERMS) {
        if (text.includes(term)) findings.push(`${relativePath}: ${term}`);
    }
}

async function inspectDirectory(relativePath: string): Promise<void> {
    const glob = new Bun.Glob(`${relativePath}/**/*.{html,ts,js}`);
    for await (const file of glob.scan({ cwd: new URL(".", root).pathname })) {
        await inspectFile(file);
    }
}

for (const path of PROTECTED_COMMERCE_PATHS) {
    if (path.endsWith("/widgets")) await inspectDirectory(path);
    else await inspectFile(path);
}

if (findings.length > 0) {
    console.error(
        "Commercial language was found in a protected connection or MCP surface:",
    );
    for (const finding of findings) console.error(`- ${finding}`);
    process.exit(1);
}

console.log("Commerce boundary check passed.");
