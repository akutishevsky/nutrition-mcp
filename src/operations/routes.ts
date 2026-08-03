import { Hono, type Context } from "hono";
import { buildReadinessReport, type ReadinessReport } from "./readiness.js";

const READINESS_CACHE_MS = 10_000;
let readinessCache: { expiresAt: number; report: ReadinessReport } | null = null;

async function readiness(): Promise<ReadinessReport> {
    if (!readinessCache || readinessCache.expiresAt <= Date.now()) {
        readinessCache = {
            report: await buildReadinessReport(),
            expiresAt: Date.now() + READINESS_CACHE_MS,
        };
    }
    return readinessCache.report;
}

export function createOperationsRouter(): Hono {
    const operations = new Hono();

    const live = (c: Context) => {
        c.set("suppressAccessLog", true);
        return c.json(
            {
                status: "ok",
                service: "munch",
                time: new Date().toISOString(),
            },
            200,
            { "Cache-Control": "no-store" },
        );
    };

    operations.get("/health", live);
    operations.get("/health/live", live);
    operations.get("/health/ready", async (c) => {
        c.set("suppressAccessLog", true);
        const report = await readiness();
        return c.json(report, report.ready ? 200 : 503, {
            "Cache-Control": "no-store",
        });
    });

    return operations;
}
