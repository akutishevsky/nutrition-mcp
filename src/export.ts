import { getAllMeals, getUserTimezone, type Meal } from "./storage.js";
import {
    cleanupExpiredExports,
    consumeExportFile,
    createExportFile,
    type ExportFile,
} from "./service-platform/repository.js";
import { formatLocalDateTime } from "./tz.js";

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
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function buildMealsCsv(meals: Meal[], tz: string): string {
    const rows = [CSV_COLUMNS.join(",")];
    for (const meal of meals) {
        rows.push(
            [
                meal.id,
                formatLocalDateTime(meal.logged_at, tz),
                tz,
                meal.meal_type,
                meal.description,
                meal.calories,
                meal.protein_g,
                meal.carbs_g,
                meal.fat_g,
                meal.fiber_g,
                meal.sugar_g,
                meal.alcohol_g,
                meal.notes,
            ]
                .map(csvEscape)
                .join(","),
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
    const created = await createExportFile({
        userId,
        fileName: `munch-meals-${new Date().toISOString().slice(0, 10)}.csv`,
        content: buildMealsCsv(meals, tz),
        expiresAt: new Date(Date.now() + EXPORT_TTL_SECONDS * 1_000),
    });
    const url = new URL("/exports/download", appBaseUrl());
    url.searchParams.set("token", created.token);
    return { count: meals.length, url: url.toString() };
}

export async function getRailwayExportFile(
    token: string,
): Promise<ExportFile | null> {
    if (token.length < 20 || token.length > 500) return null;
    return consumeExportFile(token);
}

export async function sweepStaleExports(): Promise<void> {
    const removed = await cleanupExpiredExports();
    if (removed > 0) {
        console.log(`Export sweep: removed ${removed} expired export(s).`);
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
