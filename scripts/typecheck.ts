// Typecheck production sources with Microsoft's native TypeScript compiler.
// The whole source graph exceeded the GitHub runner's time budget because the
// MCP SDK expands every tool schema through one enormous generic graph. Keep
// the graph partitioned by subsystem so each gate is bounded and failures name
// the responsible module.

const projects = [
    ["platform", "tsconfig.typecheck.platform.json"],
    ["core", "tsconfig.typecheck.core.json"],
    ["providers", "tsconfig.typecheck.providers.json"],
    ["food tools", "tsconfig.typecheck.food-tools.json"],
    ["meal-draft tools", "tsconfig.typecheck.meal-draft-tools.json"],
    ["saved-food tools", "tsconfig.typecheck.saved-food-tools.json"],
    ["MCP runtime", "tsconfig.typecheck.mcp.json"],
] as const;

const startedAt = Date.now();
const heartbeat = setInterval(() => {
    const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
    console.log(`Typecheck still running (${elapsedSeconds}s)`);
}, 30_000);

try {
    for (const [label, project] of projects) {
        console.log(`Typechecking ${label}...`);
        const proc = Bun.spawn(
            [
                "./node_modules/.bin/tsgo",
                "--project",
                project,
                "--noEmit",
                "--pretty",
                "false",
            ],
            {
                stdout: "inherit",
                stderr: "inherit",
            },
        );
        const timeout = setTimeout(() => {
            console.error(`Typecheck timed out for ${label}`);
            proc.kill();
        }, 90_000);
        const exitCode = await proc.exited;
        clearTimeout(timeout);
        if (exitCode !== 0) process.exit(exitCode);
    }
} finally {
    clearInterval(heartbeat);
}

console.log("Production sources typecheck clean with tsgo partitions");
