import {
    getSupabase,
    getAllMeals,
    getUserTimezone,
    type Meal,
} from "./supabase.js";
import { formatLocalDateTime } from "./tz.js";

const EXPORT_BUCKET = "exports";
// Signed link lifetime. The cleanup sweep ages files out on the same horizon.
const EXPORT_TTL_SECONDS = 60 * 60; // 60 minutes
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

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
    "notes",
] as const;

/** Quote a CSV field only when it contains a delimiter, quote, or newline. */
function csvEscape(value: string | number | null | undefined): string {
    if (value == null) return "";
    const str = String(value);
    if (/[",\r\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Build a CSV from meals. `logged_at` is rendered in `tz` (the user's timezone,
 * or "UTC" when none is set), and the `timezone` column records which zone the
 * timestamp is expressed in so the file is self-describing.
 */
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

/**
 * Generate a CSV of all the user's meals, upload it to the private `exports`
 * bucket under a fixed per-user path (so each export overwrites the previous
 * one), and return a signed download link valid for EXPORT_TTL_SECONDS.
 */
export async function exportMeals(userId: string): Promise<MealsExportResult> {
    const meals = await getAllMeals(userId);
    if (meals.length === 0) return { count: 0 };

    const tz = await getUserTimezone(userId);
    const csv = buildMealsCsv(meals, tz);
    const path = `${userId}/meals.csv`;

    const storage = getSupabase().storage.from(EXPORT_BUCKET);

    const { error: uploadErr } = await storage.upload(path, csv, {
        contentType: "text/csv",
        upsert: true,
    });
    if (uploadErr)
        throw new Error(`Failed to upload export: ${uploadErr.message}`);

    const { data, error: signErr } = await storage.createSignedUrl(
        path,
        EXPORT_TTL_SECONDS,
    );
    if (signErr || !data)
        throw new Error(
            `Failed to create download link: ${signErr?.message ?? "unknown error"}`,
        );

    return { count: meals.length, url: data.signedUrl };
}

/**
 * Delete export files older than the link TTL. Runs as a background sweep so no
 * export file outlives its signed URL by more than one sweep interval, even
 * across server restarts and for users who never export again.
 */
export async function sweepStaleExports(): Promise<void> {
    const storage = getSupabase().storage.from(EXPORT_BUCKET);
    const cutoff = Date.now() - EXPORT_TTL_SECONDS * 1000;

    // Files live under per-user folders, so list the root to enumerate folders,
    // then list each folder to reach the files (with their timestamps).
    const { data: folders, error: rootErr } = await storage.list("", {
        limit: 1000,
    });
    if (rootErr) {
        console.warn("Export sweep: failed to list bucket:", rootErr.message);
        return;
    }
    if (!folders) return;

    const stalePaths: string[] = [];
    for (const folder of folders) {
        const { data: files, error: listErr } = await storage.list(
            folder.name,
            { limit: 1000 },
        );
        if (listErr) {
            console.warn(
                `Export sweep: failed to list ${folder.name}:`,
                listErr.message,
            );
            continue;
        }
        for (const file of files ?? []) {
            const ts = file.updated_at ?? file.created_at;
            if (ts && new Date(ts).getTime() < cutoff) {
                stalePaths.push(`${folder.name}/${file.name}`);
            }
        }
    }

    if (stalePaths.length === 0) return;
    const { error: removeErr } = await storage.remove(stalePaths);
    if (removeErr) {
        console.warn(
            "Export sweep: failed to remove files:",
            removeErr.message,
        );
        return;
    }
    console.log(`Export sweep: removed ${stalePaths.length} stale file(s).`);
}

let sweepRunning = false;

/** Start the periodic export-cleanup sweep. Call once at server startup. */
export function startExportCleanup(): void {
    setInterval(() => {
        if (sweepRunning) return;
        sweepRunning = true;
        sweepStaleExports().finally(() => {
            sweepRunning = false;
        });
    }, SWEEP_INTERVAL_MS);
}
