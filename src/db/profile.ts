import { activityCreditPct } from "../activity.js";
import { isDrinkUnit, type DrinkUnit } from "../alcohol.js";
import {
    isLengthUnit,
    isWeightUnit,
    type LengthUnit,
    type WeightUnit,
} from "../units.js";
import { getSupabase } from "./client.js";

// ---------- Profiles ----------

export interface Profile {
    user_id: string;
    // null means "never set with set_timezone" — the column has no default
    // to fall back on that would be distinguishable from a deliberate
    // choice, so every reader must coalesce this explicitly (see
    // timezoneFromProfile / getUserTimezone below). Do not read this
    // directly to decide whether a timezone is "configured" outside those
    // two: that was #99 — a row can exist (any set_* tool creates one) with
    // this still null.
    timezone: string | null;
    preferred_weight_unit: WeightUnit | null;
    // null = never set with set_length_unit; same contract as preferred_weight_unit.
    // Coalesce through preferredLengthUnitFromProfile. Never derived from the weight unit.
    preferred_length_unit: LengthUnit | null;
    widgets_enabled: boolean;
    // Open widgets with their Show more detail already expanded. Optional in
    // the type because a database without 20261107120000_widgets_expanded.sql
    // has no such column; coalesce through widgetsExpandedFromProfile.
    widgets_expanded?: boolean;
    alcohol_tracking_enabled: boolean;
    preferred_drink_unit: DrinkUnit | null;
    // Share of active calories counted against intake, 0..100; null = never
    // set, which reads as 100. Coalesce through activityCreditPctFromProfile.
    activity_credit_pct: number | null;
    // null means "never set with set_language" — same null-is-not-a-default
    // contract as timezone above. Always coalesce through localeFromProfile /
    // getUserLocale, never read this directly.
    locale: string | null;
    created_at: string;
    updated_at: string;
}

export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await getSupabase()
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw new Error(`Failed to get profile: ${error.message}`);
    return (data as Profile | null) ?? null;
}

// Returns the timezone the user actually chose with set_timezone, or null if
// they never have — regardless of whether a profile row exists. Callers that
// need to know whether the timezone is *configured* (as opposed to what to
// display) must use this, not `profile !== null`.
export function timezoneFromProfile(
    profile: Profile | null | undefined,
): string | null {
    return profile?.timezone ?? null;
}

export async function getUserTimezone(userId: string): Promise<string> {
    return timezoneFromProfile(await getProfile(userId)) ?? "UTC";
}

// Returns the locale the user actually chose with set_language, or null if
// they never have — regardless of whether a profile row exists. Mirrors
// timezoneFromProfile: callers that need to know whether a locale is
// *configured* must use this, not `profile !== null`.
export function localeFromProfile(
    profile: Profile | null | undefined,
): string | null {
    return profile?.locale ?? null;
}

export async function getUserLocale(userId: string): Promise<string> {
    return localeFromProfile(await getProfile(userId)) ?? "en";
}

// Returns the user's saved weight-unit preference, or null if they have never
// chosen one. Write paths use null to refuse guessing; display paths coalesce
// to "kg". Mirrors timezoneFromProfile/localeFromProfile — a caller that
// already has a fetched profile (get_profile needs all six preferences at
// once) should use this instead of the *FromProfile-less
// getPreferredWeightUnit, which was the one preference without a pure
// derivation until this existed.
export function preferredWeightUnitFromProfile(
    profile: Profile | null | undefined,
): WeightUnit | null {
    const unit = profile?.preferred_weight_unit;
    return isWeightUnit(unit) ? unit : null;
}

export async function getPreferredWeightUnit(
    userId: string,
): Promise<WeightUnit | null> {
    return preferredWeightUnitFromProfile(await getProfile(userId));
}

// Returns the user's saved length-unit preference (body measurements), or null
// if they have never chosen one. Same contract as preferredWeightUnitFromProfile:
// write paths refuse to guess on null; display paths show each entry in the
// unit it was entered in. Unknown column text degrades to null. Never derived
// from the weight unit.
export function preferredLengthUnitFromProfile(
    profile: Profile | null | undefined,
): LengthUnit | null {
    const unit = profile?.preferred_length_unit;
    return isLengthUnit(unit) ? unit : null;
}

export async function getPreferredLengthUnit(
    userId: string,
): Promise<LengthUnit | null> {
    return preferredLengthUnitFromProfile(await getProfile(userId));
}

// The three display preferences below come in two halves: a pure
// *FromProfile derivation over an already-fetched row, and a thin fetching
// wrapper kept for existing call sites. A caller that needs more than one of
// them (buildMcpServer needs all three) should call getProfile once and derive
// locally — each wrapper is its own `select * from profiles` round trip, so
// chaining them multiplies an identical query by the number of preferences
// read.

// Whether in-chat widgets should be shown for this user. Defaults to true when
// no profile exists yet, or (for backward compatibility) when the column is
// absent — widgets are on for everyone until a user explicitly opts out.
export function widgetsEnabledFromProfile(
    profile: Profile | null | undefined,
): boolean {
    return profile?.widgets_enabled ?? true;
}

export async function getWidgetsEnabled(userId: string): Promise<boolean> {
    return widgetsEnabledFromProfile(await getProfile(userId));
}

// Whether widgets open expanded for this user. Off when no profile exists yet
// or the column is absent: collapsed is the default view.
export function widgetsExpandedFromProfile(
    profile: Profile | null | undefined,
): boolean {
    return profile?.widgets_expanded ?? false;
}

// Whether alcohol should be surfaced for this user. Defaults to false when no
// profile exists yet, or when the column is absent — alcohol tracking is opt-in,
// so the fallback must be "off". Storage is unaffected: alcohol explicitly
// passed is always persisted, this only gates display.
//
// The `?? false` is not a stylistic default: flipping it turns the opt-in into
// an opt-out and starts surfacing alcohol — including the trace alcohol that
// third-party recipe exports carry — to users who never asked to see it, which
// is the documented harm this toggle exists to prevent.
export function alcoholTrackingEnabledFromProfile(
    profile: Profile | null | undefined,
): boolean {
    return profile?.alcohol_tracking_enabled ?? false;
}

export async function getAlcoholTrackingEnabled(
    userId: string,
): Promise<boolean> {
    return alcoholTrackingEnabledFromProfile(await getProfile(userId));
}

// The share of active calories that counts against intake for entries logged
// from now on. Null (never set) reads as the default, 100. Coalesce through
// this; a caller must not read profile.activity_credit_pct directly.
export function activityCreditPctFromProfile(
    profile: Profile | null | undefined,
): number {
    return activityCreditPct(profile?.activity_credit_pct);
}

export async function getActivityCreditPct(userId: string): Promise<number> {
    return activityCreditPctFromProfile(await getProfile(userId));
}

// Returns the user's saved drink-unit preference, or null if they have never
// chosen one. Display paths coalesce null to "us"; storage stays in grams of
// ethanol either way. The isDrinkUnit guard is load-bearing: the column is
// free-form text to the client, so anything unrecognised must degrade to "no
// preference" rather than flow into a Record<DrinkUnit, …> lookup as undefined.
export function preferredDrinkUnitFromProfile(
    profile: Profile | null | undefined,
): DrinkUnit | null {
    const unit = profile?.preferred_drink_unit;
    return isDrinkUnit(unit) ? unit : null;
}

export async function getPreferredDrinkUnit(
    userId: string,
): Promise<DrinkUnit | null> {
    return preferredDrinkUnitFromProfile(await getProfile(userId));
}

// Upsert the fields provided in `patch`, leaving other columns untouched. On
// first insert, an omitted column falls back to its DB default where one
// exists (widgets_enabled: true, widgets_expanded: false,
// alcohol_tracking_enabled: false); timezone,
// preferred_weight_unit, preferred_length_unit and preferred_drink_unit have
// none and land as NULL, meaning "never chosen".
export async function upsertProfile(
    userId: string,
    patch: {
        timezone?: string;
        preferred_weight_unit?: WeightUnit | null;
        preferred_length_unit?: LengthUnit | null;
        widgets_enabled?: boolean;
        widgets_expanded?: boolean;
        alcohol_tracking_enabled?: boolean;
        preferred_drink_unit?: DrinkUnit | null;
        activity_credit_pct?: number | null;
        locale?: string;
    },
): Promise<Profile> {
    const payload: Record<string, unknown> = {
        user_id: userId,
        updated_at: new Date().toISOString(),
    };
    if (patch.timezone !== undefined) payload.timezone = patch.timezone;
    // null is meaningful here (clears the preference), so only skip `undefined`.
    if (patch.preferred_weight_unit !== undefined)
        payload.preferred_weight_unit = patch.preferred_weight_unit;
    if (patch.preferred_length_unit !== undefined)
        payload.preferred_length_unit = patch.preferred_length_unit;
    if (patch.widgets_enabled !== undefined)
        payload.widgets_enabled = patch.widgets_enabled;
    if (patch.widgets_expanded !== undefined)
        payload.widgets_expanded = patch.widgets_expanded;
    if (patch.alcohol_tracking_enabled !== undefined)
        payload.alcohol_tracking_enabled = patch.alcohol_tracking_enabled;
    // null is meaningful here too (clears the preference).
    if (patch.preferred_drink_unit !== undefined)
        payload.preferred_drink_unit = patch.preferred_drink_unit;
    // null is meaningful (back to the default of 100), so only skip undefined.
    if (patch.activity_credit_pct !== undefined)
        payload.activity_credit_pct = patch.activity_credit_pct;
    if (patch.locale !== undefined) payload.locale = patch.locale;

    const { data, error } = await getSupabase()
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

    if (error) throw new Error(`Failed to save profile: ${error.message}`);
    return data as Profile;
}
