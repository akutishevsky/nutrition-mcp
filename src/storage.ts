import * as railwayService from "./service-platform/repository.js";
import { resolveAccessToken } from "./oauth-platform/repository.js";

// Railway PostgreSQL is the only persistence backend.
export * from "./nutrition-platform/index.js";

export async function getCachedFood<T>(
    source: string,
    sourceId: string,
): Promise<T | null> {
    return (await railwayService.getCachedFood(source, sourceId)) as T | null;
}

export const cacheFood = railwayService.cacheFood;
export const insertToolAnalytics = railwayService.insertToolAnalytics;
export const getLandingStats = railwayService.getLandingStats;

export async function getUserIdByToken(
    token: string,
): Promise<
    | { status: "valid"; userId: string }
    | { status: "invalid" }
    | { status: "unavailable" }
> {
    try {
        const lookup = await resolveAccessToken(token);
        return lookup.status === "valid"
            ? { status: "valid", userId: lookup.userId }
            : { status: "invalid" };
    } catch {
        return { status: "unavailable" };
    }
}

export type {
    CountryStat,
    ExportFile,
    LandingStats,
} from "./service-platform/repository.js";
