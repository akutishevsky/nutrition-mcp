import {
    getSupabase,
    getAllMeals,
    getUserTimezone,
    railwayDataEnabled,
    type Meal,
} from "./supabase.js";
import {
    cleanupExpiredExports,
    consumeExportFile,
    createExportFile,
    type ExportFile,
} from "./service-platform/repository.js";
import { formatLocalDateTime } from "./tz.js";

const EXPORT_BUCKET = "exports";
const EXPORT_TTL_SECONDS = 60 * 60;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

const CSV_COLUMNS = [
    "id",
    "logged_at",
    "timezone",
    "meal_type",
    "description",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "sugar_g",
    "alcohol_g",
    "notes",
] as const;

function csvEscape(value: string | number | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function buildMealsCsv(meals: Meal[], tz: string): string {
    const rows = [CSV_COLUMNS.join(",")];
    for (const m of meals) {
        rows.push(
            [
                csvEscape(m.id),
                csvEscape(formatLocalDateTime(m.logged_at, tz)),
                csvEscape(tz),
                csvEscape(m.meal_type),
                csvEscape(m.description),
                csvEscape(m.calories),
                csvEscape(m.protein_g),
                csvEscape(m.carbs_g),
                csvEscape(m.fat_g),
                csvEscape(m.fiber_g),
                csvEscape(m.sugar_g),
                csvEscape(m.alcohol_g),
                csvEscape(m.notes),
            ].join(","),
        );
    }
    return rows.join("\n");
}

export interface MealsExportResult {
    count: number;
    url?: string;
}

function appBaseUrl(): string {
    const value = process.env.MUNCH_APP_BASE_URL?.trim();
    if (!value) throw new Error("MUNCH_APP_BASE_URL is required for exports");
    const url = new URL(value);
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        throw new Error("MUNCH_APP_BASE_URL must use HTTPS in production");
    }
    return url.origin;
}

export async function exportMeals(userId: string): Promise<MealsExportResult> {
    const meals = await getAllMeals(userId);
    if (meals.length === 0) return { count: 0 };

    const tz = await getUserTimezone(userId);
    const csv = buildMealsCsv(meals, tz);

    if (railwayDataEnabled) {
        const created = await createExportFile({
            userId,
            fileName: `munch-meals-${new Date().toISOString().slice(0, 10)}.csv`,
            content: csv,
            expiresAt: new Date(Date.now() + EXPORT_TTL_SECONDS * 1_000),
        });
        const url = new URL("/exports/download", appBaseUrl());
        url.searchParams.set("token", created.token);
        return { count: meals.length, url: url.toString() };
    }

    const path = `${userId}/meals.csv`;
    const storage = getSupabase().storage.from(EXPORT_BUCKET);
    const { error: uploadErr } = await storage.upload(path, csv, {
        contentType: "text/csv",
        upsert: true,
    });
    if (uploadErr) {
        throw new Error(`Failed to upload export: ${uploadErr.message}`);
    }
    const { data, error: signErr } = await storage.createSignedUrl(
        path,
        EXPORT_TTL_SECONDS,
    );
    if (signErr || !data) {
        throw new Error(
            `Failed to create download link: ${signErr?.message ?? "unknown error"}`,
        );
    }
    return { count: meals.length, url: data.signedUrl };
}

export async function getRailwayExportFile(
    token: string,
): Promise<ExportFile | null> {
    if (!railwayDataEnabled || token.length < 20 || token.length > 500) {
        return null;
    }
    return consumeExportFile(token);
}

export async function sweepStaleExports(): Promise<void> {
    if (railwayDataEnabled) {
        const removed = await cleanupExpiredExports();
        if (removed > 0) {
            console.log(
                `Export sweep: removed ${removed} expired Railway export(s).`,
            );
        }
        return;
    }

    const storage = getSupabase().storage.from(EXPORT_BUCKET);
    const cutoff = Date.now() - EXPORT_TTL_SECONDS * 1000;
    const { data: folders, error: rootErr } = await storage.list("", {
        limit: 1000,
    });
    if (rootErr) {
        console.warn("Export sweep: failed to list bucket");
        return;
    }
    const stalePaths: string[] = [];
    for (const folder of folders ?? []) {
        const { data: files, error: listErr } = await storage.list(
            folder.name,
            {
                limit: 1000,
            },
        );
        if (listErr) continue;
        for (const file of files ?? []) {
            const timestamp = file.updated_at ?? file.created_at;
            if (timestamp && new Date(timestamp).getTime() < cutoff) {
                stalePaths.push(`${folder.name}/${file.name}`);
            }
        }
    }
    if (stalePaths.length > 0) {
        await storage.remove(stalePaths);
    }
}

let sweepRunning = false;

export function startExportCleanup(): void {
    setInterval(() => {
        if (sweepRunning) return;
        sweepRunning = true;
        sweepStaleExports().finally(() => {
            sweepRunning = false;
        });
    }, SWEEP_INTERVAL_MS);
}
