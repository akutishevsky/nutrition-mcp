import { isDrinkUnit, type DrinkUnit } from "../alcohol.js";
import { withUserDatabase } from "../platform/database.js";
import { isWeightUnit, type WeightUnit } from "../units.js";
import { booleanValue, isoTimestamp, stringOrNull } from "./shared.js";
import type { Profile, ProfilePatch } from "./types.js";

interface ProfileRow {
    user_id: string;
    timezone: string | null;
    preferred_weight_unit: string | null;
    widgets_enabled: boolean;
    alcohol_tracking_enabled: boolean;
    preferred_drink_unit: string | null;
    created_at: Date | string;
    updated_at: Date | string;
}

function mapProfile(row: ProfileRow): Profile {
    const weightUnit = stringOrNull(row.preferred_weight_unit);
    const drinkUnit = stringOrNull(row.preferred_drink_unit);
    return {
        user_id: row.user_id,
        timezone: row.timezone ?? "UTC",
        preferred_weight_unit: isWeightUnit(weightUnit) ? weightUnit : null,
        widgets_enabled: booleanValue(row.widgets_enabled, true),
        alcohol_tracking_enabled: booleanValue(
            row.alcohol_tracking_enabled,
            false,
        ),
        preferred_drink_unit: isDrinkUnit(drinkUnit) ? drinkUnit : null,
        created_at: isoTimestamp(row.created_at),
        updated_at: isoTimestamp(row.updated_at),
    };
}

export async function getProfile(userId: string): Promise<Profile | null> {
    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<ProfileRow>>`
            select
                user_id,
                timezone,
                preferred_weight_unit,
                widgets_enabled,
                alcohol_tracking_enabled,
                preferred_drink_unit,
                created_at,
                updated_at
            from munch.account_preferences
            where user_id = ${userId}
        `;
        return rows[0] ? mapProfile(rows[0]) : null;
    });
}

export async function getUserTimezone(userId: string): Promise<string> {
    return (await getProfile(userId))?.timezone ?? "UTC";
}

export async function getPreferredWeightUnit(
    userId: string,
): Promise<WeightUnit | null> {
    return (await getProfile(userId))?.preferred_weight_unit ?? null;
}

export function widgetsEnabledFromProfile(
    profile: Profile | null | undefined,
): boolean {
    return profile?.widgets_enabled ?? true;
}

export async function getWidgetsEnabled(userId: string): Promise<boolean> {
    return widgetsEnabledFromProfile(await getProfile(userId));
}

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

export async function upsertProfile(
    userId: string,
    patch: ProfilePatch,
): Promise<Profile> {
    const timezoneProvided = patch.timezone !== undefined;
    const weightUnitProvided = patch.preferred_weight_unit !== undefined;
    const widgetsProvided = patch.widgets_enabled !== undefined;
    const alcoholProvided = patch.alcohol_tracking_enabled !== undefined;
    const drinkUnitProvided = patch.preferred_drink_unit !== undefined;

    return withUserDatabase(userId, async (tx) => {
        const rows = await tx<Array<ProfileRow>>`
            insert into munch.account_preferences (
                user_id,
                timezone,
                preferred_weight_unit,
                widgets_enabled,
                alcohol_tracking_enabled,
                preferred_drink_unit
            ) values (
                ${userId},
                ${patch.timezone ?? "UTC"},
                ${patch.preferred_weight_unit ?? null},
                ${patch.widgets_enabled ?? true},
                ${patch.alcohol_tracking_enabled ?? false},
                ${patch.preferred_drink_unit ?? null}
            )
            on conflict (user_id) do update
            set timezone = case
                    when ${timezoneProvided} then ${patch.timezone ?? null}
                    else munch.account_preferences.timezone
                end,
                preferred_weight_unit = case
                    when ${weightUnitProvided} then ${patch.preferred_weight_unit ?? null}
                    else munch.account_preferences.preferred_weight_unit
                end,
                widgets_enabled = case
                    when ${widgetsProvided} then ${patch.widgets_enabled ?? true}
                    else munch.account_preferences.widgets_enabled
                end,
                alcohol_tracking_enabled = case
                    when ${alcoholProvided} then ${patch.alcohol_tracking_enabled ?? false}
                    else munch.account_preferences.alcohol_tracking_enabled
                end,
                preferred_drink_unit = case
                    when ${drinkUnitProvided} then ${patch.preferred_drink_unit ?? null}
                    else munch.account_preferences.preferred_drink_unit
                end,
                updated_at = now()
            returning
                user_id,
                timezone,
                preferred_weight_unit,
                widgets_enabled,
                alcohol_tracking_enabled,
                preferred_drink_unit,
                created_at,
                updated_at
        `;
        if (!rows[0]) throw new Error("Failed to save profile");
        return mapProfile(rows[0]);
    });
}
