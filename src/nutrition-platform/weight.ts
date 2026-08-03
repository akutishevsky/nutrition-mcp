import { decodeEscapeSequences } from "../normalize.js";
import { withUserDatabase } from "../platform/database.js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "../tz.js";
import {
    deriveIdempotencyKey,
    isoTimestamp,
    requiredNumber,
    stringOrNull,
} from "./shared.js";
import type {
    WeightEntry,
    WeightInput,
    WeightInsertResult,
} from "./types.js";

interface WeightRow {
    id: string;
    user_id: string;
    weight_g: number | string;
    logged_at: Date | string;
    notes: string | null;
    created_at: Date | string;
    idempotency_key: string | null;
}

function mapWeight(row: WeightRow): WeightEntry {
    return {
        id: row.id,
        user_id: row.user_id,
        weight_g: requiredNumber(row.weight_g),
        logged_at: isoTimestamp(row.logged_at),
        notes: stringOrNull(row.notes),
        created_at: isoTimestamp(row.created_at),
        idempotency_key: stringOrNull(row.idempotency_key),
    };
}

export async function insertWeight(
    userId: string,
    input: WeightInput,
): Promise<WeightInsertResult> {
    const loggedAt = input.logged_at ?? new Date().toISOString();
    const idempotencyKey =
        input.idempotency_key ??
        deriveIdempotencyKey([
            userId,
            input.weight_g,
            input.notes,
            loggedAt,
        ]);

    return withUserDatabase(userId, async (tx) => {
        const inserted = await tx<Array<WeightRow>>`
            insert into munch.weight_logs (
                user_id,
                weight_g,
                logged_at,
                notes,
                idempotency_key
            ) values (
                ${userId},
                ${input.weight_g},
                ${loggedAt},
                ${input.notes ?? null},
                ${idempotencyKey}
            )
            on conflict (user_id, idempotency_key)
                where idempotency_key is not null
            do nothing
            returning
                id, user_id, weight_g, logged_at, notes, created_at,
                idempotency_key
        `;
        if (inserted[0]) {
            return { entry: mapWeight(inserted[0]), deduplicated: false };
        }

        const existing = await tx<Array<WeightRow>>`
            select
                id, user_id, weight_g, logged_at, notes, created_at,
                idempotency_key
            from munch.weight_logs
            where user_id = ${userId}
              and idempotency_key = ${idempotencyKey}
        `;
        if (!existing[0]) {
            throw new Error("Failed to resolve idempotent weight insert");
        }
        return { entry: mapWeight(existing[0]), deduplicated: true };
    });
}

async function weightBetween(
    userId: string,
    start: Date,
    end: Date,
): Promise<WeightEntry[]> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<WeightRow>>`
            select
                id, user_id, weight_g, logged_at, notes, created_at,
                idempotency_key
            from munch.weight_logs
            where user_id = ${userId}
              and logged_at >= ${start}
              and logged_at < ${end}
            order by logged_at asc
        `;
        return rows.map(mapWeight);
    });
}

export function getWeightByDate(
    userId: string,
    date: string,
    tz = "UTC",
): Promise<WeightEntry[]> {
    return weightBetween(
        userId,
        zonedDayStartUtc(date, tz),
        zonedNextDayStartUtc(date, tz),
    );
}

export function getWeightInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz = "UTC",
): Promise<WeightEntry[]> {
    return weightBetween(
        userId,
        zonedDayStartUtc(startDate, tz),
        zonedNextDayStartUtc(endDate, tz),
    );
}

export async function getLatestWeight(
    userId: string,
): Promise<WeightEntry | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<WeightRow>>`
            select
                id, user_id, weight_g, logged_at, notes, created_at,
                idempotency_key
            from munch.weight_logs
            where user_id = ${userId}
            order by logged_at desc
            limit 1
        `;
        return rows[0] ? mapWeight(rows[0]) : null;
    });
}

export async function updateWeight(
    userId: string,
    id: string,
    fields: { weight_g?: number; logged_at?: string; notes?: string | null },
): Promise<WeightEntry> {
    const weightProvided = fields.weight_g !== undefined;
    const loggedAtProvided = fields.logged_at !== undefined;
    const notesProvided = fields.notes !== undefined;

    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<WeightRow>>`
            update munch.weight_logs
            set weight_g = case
                    when ${weightProvided} then ${fields.weight_g ?? null}
                    else weight_g
                end,
                logged_at = case
                    when ${loggedAtProvided} then ${fields.logged_at ?? null}::timestamptz
                    else logged_at
                end,
                notes = case
                    when ${notesProvided} then ${fields.notes == null ? null : decodeEscapeSequences(fields.notes)}
                    else notes
                end,
                updated_at = now()
            where id = ${id}
              and user_id = ${userId}
            returning
                id, user_id, weight_g, logged_at, notes, created_at,
                idempotency_key
        `;
        if (!rows[0]) throw new Error("Weight entry not found");
        return mapWeight(rows[0]);
    });
}

export async function deleteWeight(
    userId: string,
    id: string,
): Promise<boolean> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<{ id: string }>>`
            delete from munch.weight_logs
            where id = ${id}
              and user_id = ${userId}
            returning id
        `;
        return Boolean(rows[0]);
    });
}
