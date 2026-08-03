import { withUserDatabase } from "../platform/database.js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "../tz.js";
import {
    deriveIdempotencyKey,
    isoTimestamp,
    requiredNumber,
    stringOrNull,
} from "./shared.js";
import type {
    WaterEntry,
    WaterInput,
    WaterInsertResult,
} from "./types.js";

interface WaterRow {
    id: string;
    user_id: string;
    amount_ml: number | string;
    logged_at: Date | string;
    notes: string | null;
    created_at: Date | string;
    idempotency_key: string | null;
}

function mapWater(row: WaterRow): WaterEntry {
    return {
        id: row.id,
        user_id: row.user_id,
        amount_ml: requiredNumber(row.amount_ml),
        logged_at: isoTimestamp(row.logged_at),
        notes: stringOrNull(row.notes),
        created_at: isoTimestamp(row.created_at),
        idempotency_key: stringOrNull(row.idempotency_key),
    };
}

export async function insertWater(
    userId: string,
    input: WaterInput,
): Promise<WaterInsertResult> {
    const loggedAt = input.logged_at ?? new Date().toISOString();
    const idempotencyKey =
        input.idempotency_key ??
        deriveIdempotencyKey([
            userId,
            input.amount_ml,
            input.notes,
            loggedAt,
        ]);

    return withUserDatabase(userId, async (tx) => {
        const inserted = await tx<Array<WaterRow>>`
            insert into munch.water_logs (
                user_id,
                amount_ml,
                logged_at,
                notes,
                idempotency_key
            ) values (
                ${userId},
                ${input.amount_ml},
                ${loggedAt},
                ${input.notes ?? null},
                ${idempotencyKey}
            )
            on conflict (user_id, idempotency_key)
                where idempotency_key is not null
            do nothing
            returning
                id, user_id, amount_ml, logged_at, notes, created_at,
                idempotency_key
        `;
        if (inserted[0]) {
            return { entry: mapWater(inserted[0]), deduplicated: false };
        }

        const existing = await tx<Array<WaterRow>>`
            select
                id, user_id, amount_ml, logged_at, notes, created_at,
                idempotency_key
            from munch.water_logs
            where user_id = ${userId}
              and idempotency_key = ${idempotencyKey}
        `;
        if (!existing[0]) {
            throw new Error("Failed to resolve idempotent water insert");
        }
        return { entry: mapWater(existing[0]), deduplicated: true };
    });
}

async function waterBetween(
    userId: string,
    start: Date,
    end: Date,
): Promise<WaterEntry[]> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<WaterRow>>`
            select
                id, user_id, amount_ml, logged_at, notes, created_at,
                idempotency_key
            from munch.water_logs
            where user_id = ${userId}
              and logged_at >= ${start}
              and logged_at < ${end}
            order by logged_at asc
        `;
        return rows.map(mapWater);
    });
}

export function getWaterByDate(
    userId: string,
    date: string,
    tz = "UTC",
): Promise<WaterEntry[]> {
    return waterBetween(
        userId,
        zonedDayStartUtc(date, tz),
        zonedNextDayStartUtc(date, tz),
    );
}

export function getWaterInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz = "UTC",
): Promise<WaterEntry[]> {
    return waterBetween(
        userId,
        zonedDayStartUtc(startDate, tz),
        zonedNextDayStartUtc(endDate, tz),
    );
}

export async function deleteWater(userId: string, id: string): Promise<void> {
    await withUserDatabase(userId, async (tx) => {
        await tx`
            delete from munch.water_logs
            where id = ${id}
              and user_id = ${userId}
        `;
    });
}
