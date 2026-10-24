// Widget-only payloads for get_weight_trends: the per-reading weigh-in list
// and the body-measurement history the weight-trends widget's details view
// shows. Pure — no Supabase, no mcp.ts — so it unit tests with fixtures.
//
// Both ride in the CallToolResult's `_meta` (WEIGHT_ENTRIES_META_KEY and
// BODY_MEASUREMENTS_META_KEY in src/widgets.ts), never in structuredContent:
// get_weight_trends' output schema is frozen, and hosts validate against a
// cached copy of it. Notes are user text: they travel here to the widget
// only and are never logged.

import { formatLocalDateTime, shiftLocalDate } from "./tz.js";
import {
    BODY_MEASUREMENT_KINDS,
    fromGrams,
    fromMillimetres,
    type BodyMeasurementKind,
    type LengthUnit,
    type WeightUnit,
} from "./units.js";

/** Both payloads cover the last this-many days, ending on the window end. */
export const WIDGET_HISTORY_DAYS = 365;
/** At most this many weigh-ins are sent (the newest kept). */
export const WEIGHT_ENTRIES_CAP = 1500;
/** At most this many measurements per site are sent (the newest kept). */
export const MEASUREMENTS_PER_SITE_CAP = 400;
/** A note longer than this is clipped (with an ellipsis) in the payload. */
export const ENTRY_NOTE_MAX_CHARS = 280;

export const WEIGHT_ENTRIES_META_VERSION = 1;
export const BODY_MEASUREMENTS_META_VERSION = 1;

export interface WeightEntryRow {
    weight_g: number;
    logged_at: string;
    notes?: string | null;
}

export interface WeightEntriesMeta {
    v: 1;
    unit: string;
    /** The user's current local date (for "Today", "This week"). */
    today: string;
    /** First local date covered (inclusive). */
    from: string;
    /** Last local date covered (inclusive): the tool's window end. */
    to: string;
    /** True when WEIGHT_ENTRIES_CAP dropped older readings in [from, to]. */
    truncated: boolean;
    /** Oldest first. `time` is local HH:MM, `weight` 1 decimal. */
    entries: {
        date: string;
        time: string;
        weight: number;
        note: string | null;
    }[];
}

function clipNote(note: string | null | undefined): string | null {
    if (typeof note !== "string") return null;
    const t = note.trim();
    if (!t) return null;
    return t.length > ENTRY_NOTE_MAX_CHARS
        ? `${t.slice(0, ENTRY_NOTE_MAX_CHARS - 1)}…`
        : t;
}

function localParts(
    instant: string,
    tz: string,
): { date: string; time: string } {
    const s = formatLocalDateTime(instant, tz); // "YYYY-MM-DD HH:mm:ss"
    return { date: s.slice(0, 10), time: s.slice(11, 16) };
}

/**
 * Every weigh-in from `to − 364` through `to` (local dates in `tz`), oldest
 * first, in the display unit at 1 decimal, with its local time and note.
 */
export function buildWeightEntriesMeta(
    rows: readonly WeightEntryRow[],
    tz: string,
    unit: WeightUnit,
    to: string,
    today: string,
): WeightEntriesMeta {
    const from = shiftLocalDate(to, -(WIDGET_HISTORY_DAYS - 1));
    const all = rows
        .map((r) => ({ r, ...localParts(r.logged_at, tz) }))
        .filter((x) => x.date >= from && x.date <= to)
        .sort((a, b) =>
            a.r.logged_at < b.r.logged_at
                ? -1
                : a.r.logged_at > b.r.logged_at
                  ? 1
                  : 0,
        );
    const kept =
        all.length > WEIGHT_ENTRIES_CAP
            ? all.slice(all.length - WEIGHT_ENTRIES_CAP)
            : all;
    return {
        v: WEIGHT_ENTRIES_META_VERSION,
        unit,
        today,
        from,
        to,
        truncated: kept.length < all.length,
        entries: kept.map((x) => ({
            date: x.date,
            time: x.time,
            weight: fromGrams(x.r.weight_g, unit),
            note: clipNote(x.r.notes),
        })),
    };
}

export interface MeasurementRow {
    kind: BodyMeasurementKind;
    value_mm: number;
    value_entered: number | string;
    entered_unit: LengthUnit;
    logged_at: string;
}

export interface BodyMeasurementsMeta {
    v: 1;
    from: string;
    to: string;
    /** Only sites with at least one entry. Values 1 decimal in `unit`. */
    sites: Partial<
        Record<
            BodyMeasurementKind,
            { unit: LengthUnit; entries: { date: string; value: number }[] }
        >
    >;
}

/**
 * The display value of one entry in `unit`: exactly what the user typed when
 * it was entered in that unit (so the number they said is the number shown),
 * else converted from the canonical millimetres.
 */
function valueIn(row: MeasurementRow, unit: LengthUnit): number {
    if (row.entered_unit === unit) {
        const v = Number(row.value_entered);
        if (Number.isFinite(v)) return Math.round(v * 10) / 10;
    }
    return fromMillimetres(row.value_mm, unit);
}

/**
 * Body measurements from `to − 364` through `to`, grouped by site in the
 * fixed site order, oldest first. Each site is shown in the saved length
 * unit, or — with none saved — in the unit its latest entry was entered in.
 */
export function buildBodyMeasurementsMeta(
    rows: readonly MeasurementRow[],
    tz: string,
    preferred: LengthUnit | null,
    to: string,
): BodyMeasurementsMeta {
    const from = shiftLocalDate(to, -(WIDGET_HISTORY_DAYS - 1));
    const sites: BodyMeasurementsMeta["sites"] = {};
    for (const kind of BODY_MEASUREMENT_KINDS) {
        const own = rows
            .filter((r) => r.kind === kind)
            .map((r) => ({ r, date: localParts(r.logged_at, tz).date }))
            .filter((x) => x.date >= from && x.date <= to)
            .sort((a, b) =>
                a.r.logged_at < b.r.logged_at
                    ? -1
                    : a.r.logged_at > b.r.logged_at
                      ? 1
                      : 0,
            );
        if (own.length === 0) continue;
        const kept =
            own.length > MEASUREMENTS_PER_SITE_CAP
                ? own.slice(own.length - MEASUREMENTS_PER_SITE_CAP)
                : own;
        const unit = preferred ?? kept[kept.length - 1]!.r.entered_unit;
        sites[kind] = {
            unit,
            entries: kept.map((x) => ({
                date: x.date,
                value: valueIn(x.r, unit),
            })),
        };
    }
    return { v: BODY_MEASUREMENTS_META_VERSION, from, to, sites };
}
