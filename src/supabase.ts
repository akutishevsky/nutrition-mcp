import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { zonedDayStartUtc, zonedNextDayStartUtc } from "./tz.js";
import { decodeEscapeSequences } from "./normalize.js";

let supabase: SupabaseClient;

function buildClient(): SupabaseClient {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
    }
    // persistSession: false keeps the client stateless — signIn/signUp on this
    // client won't attach a user JWT to future requests. Without this, the
    // singleton would silently downgrade from service-role to authenticated
    // after any auth call, making RLS fire on subsequent writes.
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}

export function getSupabase(): SupabaseClient {
    if (!supabase) supabase = buildClient();
    return supabase;
}

// ---------- Auth ----------

export async function signUpUser(
    email: string,
    password: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const { data, error } = await buildClient().auth.signUp({
        email,
        password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign-up failed");
    return data.user.id;
}

export async function signInUser(
    email: string,
    password: string,
): Promise<string> {
    const { data, error } = await buildClient().auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw new Error(error.message);
    return data.user.id;
}

export async function signInWithGoogleIdToken(
    idToken: string,
    nonce: string,
): Promise<string> {
    // Use a throw-away client so the session never lands on the shared singleton.
    const { data, error } = await buildClient().auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        nonce,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Google sign-in failed");
    return data.user.id;
}

// ---------- Idempotency ----------

// Derive a stable idempotency key from the request content so the column is
// always populated and retries dedupe even when the client omits a key. The
// resolved logged_at is part of the digest, so two genuinely separate but
// otherwise-identical entries (logged at different times) get distinct keys and
// are never wrongly merged. A retry replays the same args — including the same
// logged_at — and therefore lands on the same key. The "auto:" prefix marks
// server-derived keys, distinguishing them from client-supplied ones.
function deriveIdempotencyKey(
    parts: (string | number | null | undefined)[],
): string {
    const digest = new Bun.CryptoHasher("sha256")
        .update(parts.map((p) => p ?? "").join("\u0000"))
        .digest("hex");
    return `auto:${digest}`;
}

// ---------- Meals ----------

export interface Meal {
    id: string;
    user_id: string;
    logged_at: string;
    meal_type: string | null;
    description: string;
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
    notes: string | null;
    idempotency_key: string | null;
}

export interface MealInput {
    description: string;
    meal_type: "breakfast" | "lunch" | "dinner" | "snack";
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface MealInsertResult {
    meal: Meal;
    deduplicated: boolean;
}

export async function insertMeal(
    userId: string,
    input: MealInput,
): Promise<MealInsertResult> {
    const sb = getSupabase();

    // Resolve logged_at once so the digest and the persisted row agree.
    const loggedAt = input.logged_at ?? new Date().toISOString();
    // Always populate the key: use the client's if given, otherwise derive a
    // stable one from the request content (see deriveIdempotencyKey).
    const idempotencyKey =
        input.idempotency_key ??
        deriveIdempotencyKey([
            userId,
            input.description,
            input.meal_type,
            input.calories,
            input.protein_g,
            input.carbs_g,
            input.fat_g,
            input.notes,
            loggedAt,
        ]);

    const { data: existing, error: selErr } = await sb
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
    if (selErr) throw new Error(`Failed to look up meal: ${selErr.message}`);
    if (existing) return { meal: existing as Meal, deduplicated: true };

    const { data, error } = await sb
        .from("meals")
        .insert({
            user_id: userId,
            description: decodeEscapeSequences(input.description),
            meal_type: input.meal_type,
            calories: input.calories ?? null,
            protein_g: input.protein_g ?? null,
            carbs_g: input.carbs_g ?? null,
            fat_g: input.fat_g ?? null,
            logged_at: loggedAt,
            notes:
                input.notes != null ? decodeEscapeSequences(input.notes) : null,
            idempotency_key: idempotencyKey,
        })
        .select()
        .single();

    if (error) {
        // Concurrent retry with the same idempotency key — the other request
        // already inserted the row. Fetch and return it instead of failing.
        if (error.code === "23505") {
            const { data: existing, error: raceErr } = await sb
                .from("meals")
                .select("*")
                .eq("user_id", userId)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();
            if (raceErr)
                throw new Error(
                    `Failed to resolve idempotent meal: ${raceErr.message}`,
                );
            if (existing) return { meal: existing as Meal, deduplicated: true };
        }
        throw new Error(`Failed to insert meal: ${error.message}`);
    }
    return { meal: data as Meal, deduplicated: false };
}

export async function getMealsByDate(
    userId: string,
    date: string,
    tz: string = "UTC",
): Promise<Meal[]> {
    const startUtc = zonedDayStartUtc(date, tz);
    const endUtc = zonedNextDayStartUtc(date, tz);

    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get meals: ${error.message}`);
    return (data as Meal[]) ?? [];
}

export async function getMealsInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<Meal[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get meals: ${error.message}`);
    return (data as Meal[]) ?? [];
}

export async function getAllMeals(userId: string): Promise<Meal[]> {
    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get meals: ${error.message}`);
    return (data as Meal[]) ?? [];
}

export async function deleteMeal(userId: string, id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("meals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete meal: ${error.message}`);
}

export async function updateMeal(
    userId: string,
    id: string,
    fields: Partial<MealInput>,
): Promise<Meal> {
    const update: Record<string, unknown> = {};
    if (fields.description !== undefined)
        update.description = decodeEscapeSequences(fields.description);
    if (fields.meal_type !== undefined) update.meal_type = fields.meal_type;
    if (fields.calories !== undefined) update.calories = fields.calories;
    if (fields.protein_g !== undefined) update.protein_g = fields.protein_g;
    if (fields.carbs_g !== undefined) update.carbs_g = fields.carbs_g;
    if (fields.fat_g !== undefined) update.fat_g = fields.fat_g;
    if (fields.logged_at !== undefined) update.logged_at = fields.logged_at;
    if (fields.notes !== undefined)
        update.notes =
            fields.notes != null
                ? decodeEscapeSequences(fields.notes)
                : fields.notes;

    const { data, error } = await getSupabase()
        .from("meals")
        .update(update)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) throw new Error(`Failed to update meal: ${error.message}`);
    return data as Meal;
}

// ---------- Profiles ----------

export interface Profile {
    user_id: string;
    timezone: string;
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

export async function getUserTimezone(userId: string): Promise<string> {
    const profile = await getProfile(userId);
    return profile?.timezone ?? "UTC";
}

export async function upsertProfile(
    userId: string,
    timezone: string,
): Promise<Profile> {
    const { data, error } = await getSupabase()
        .from("profiles")
        .upsert(
            {
                user_id: userId,
                timezone,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
        )
        .select()
        .single();

    if (error) throw new Error(`Failed to save profile: ${error.message}`);
    return data as Profile;
}

// ---------- Nutrition goals ----------

export interface NutritionGoals {
    user_id: string;
    daily_calories: number | null;
    daily_protein_g: number | null;
    daily_carbs_g: number | null;
    daily_fat_g: number | null;
    daily_water_ml: number | null;
    updated_at: string;
}

export interface NutritionGoalsInput {
    daily_calories?: number | null;
    daily_protein_g?: number | null;
    daily_carbs_g?: number | null;
    daily_fat_g?: number | null;
    daily_water_ml?: number | null;
}

export async function upsertNutritionGoals(
    userId: string,
    input: NutritionGoalsInput,
): Promise<NutritionGoals> {
    const { data, error } = await getSupabase()
        .from("nutrition_goals")
        .upsert(
            {
                user_id: userId,
                daily_calories: input.daily_calories ?? null,
                daily_protein_g: input.daily_protein_g ?? null,
                daily_carbs_g: input.daily_carbs_g ?? null,
                daily_fat_g: input.daily_fat_g ?? null,
                daily_water_ml: input.daily_water_ml ?? null,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
        )
        .select()
        .single();

    if (error) throw new Error(`Failed to save goals: ${error.message}`);
    return data as NutritionGoals;
}

export async function getNutritionGoals(
    userId: string,
): Promise<NutritionGoals | null> {
    const { data, error } = await getSupabase()
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw new Error(`Failed to get goals: ${error.message}`);
    return (data as NutritionGoals | null) ?? null;
}

// ---------- Water log ----------

export interface WaterEntry {
    id: string;
    user_id: string;
    amount_ml: number;
    logged_at: string;
    notes: string | null;
    created_at: string;
    idempotency_key: string | null;
}

export interface WaterInput {
    amount_ml: number;
    logged_at?: string;
    notes?: string;
    idempotency_key?: string;
}

export interface WaterInsertResult {
    entry: WaterEntry;
    deduplicated: boolean;
}

export async function insertWater(
    userId: string,
    input: WaterInput,
): Promise<WaterInsertResult> {
    const sb = getSupabase();

    // Resolve logged_at once so the digest and the persisted row agree.
    const loggedAt = input.logged_at ?? new Date().toISOString();
    // Always populate the key: use the client's if given, otherwise derive a
    // stable one from the request content (see deriveIdempotencyKey).
    const idempotencyKey =
        input.idempotency_key ??
        deriveIdempotencyKey([userId, input.amount_ml, input.notes, loggedAt]);

    const { data: existing, error: selErr } = await sb
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
    if (selErr) throw new Error(`Failed to look up water: ${selErr.message}`);
    if (existing) return { entry: existing as WaterEntry, deduplicated: true };

    const { data, error } = await sb
        .from("water_log")
        .insert({
            user_id: userId,
            amount_ml: input.amount_ml,
            logged_at: loggedAt,
            notes: input.notes ?? null,
            idempotency_key: idempotencyKey,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            const { data: existing, error: raceErr } = await sb
                .from("water_log")
                .select("*")
                .eq("user_id", userId)
                .eq("idempotency_key", idempotencyKey)
                .maybeSingle();
            if (raceErr)
                throw new Error(
                    `Failed to resolve idempotent water: ${raceErr.message}`,
                );
            if (existing)
                return {
                    entry: existing as WaterEntry,
                    deduplicated: true,
                };
        }
        throw new Error(`Failed to insert water: ${error.message}`);
    }
    return { entry: data as WaterEntry, deduplicated: false };
}

export async function getWaterByDate(
    userId: string,
    date: string,
    tz: string = "UTC",
): Promise<WaterEntry[]> {
    const startUtc = zonedDayStartUtc(date, tz);
    const endUtc = zonedNextDayStartUtc(date, tz);

    const { data, error } = await getSupabase()
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get water: ${error.message}`);
    return (data as WaterEntry[]) ?? [];
}

export async function getWaterInRange(
    userId: string,
    startDate: string,
    endDate: string,
    tz: string = "UTC",
): Promise<WaterEntry[]> {
    const startUtc = zonedDayStartUtc(startDate, tz);
    const endUtc = zonedNextDayStartUtc(endDate, tz);

    const { data, error } = await getSupabase()
        .from("water_log")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startUtc.toISOString())
        .lt("logged_at", endUtc.toISOString())
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get water: ${error.message}`);
    return (data as WaterEntry[]) ?? [];
}

export async function deleteWater(userId: string, id: string): Promise<void> {
    const { error } = await getSupabase()
        .from("water_log")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete water: ${error.message}`);
}

// ---------- Delete all user data ----------

export async function deleteAllUserData(userId: string): Promise<void> {
    const sb = getSupabase();

    const { error: analyticsErr } = await sb
        .from("tool_analytics")
        .delete()
        .eq("user_id", userId);
    if (analyticsErr)
        throw new Error(`Failed to delete analytics: ${analyticsErr.message}`);

    const { error: waterErr } = await sb
        .from("water_log")
        .delete()
        .eq("user_id", userId);
    if (waterErr)
        throw new Error(`Failed to delete water log: ${waterErr.message}`);

    const { error: goalsErr } = await sb
        .from("nutrition_goals")
        .delete()
        .eq("user_id", userId);
    if (goalsErr)
        throw new Error(`Failed to delete goals: ${goalsErr.message}`);

    const { error: profileErr } = await sb
        .from("profiles")
        .delete()
        .eq("user_id", userId);
    if (profileErr)
        throw new Error(`Failed to delete profile: ${profileErr.message}`);

    // Remove any meal-export file from the "exports" storage bucket. Missing
    // paths are not an error, so this is a no-op for users who never exported.
    const { error: exportErr } = await sb.storage
        .from("exports")
        .remove([`${userId}/meals.csv`]);
    if (exportErr)
        throw new Error(`Failed to delete exports: ${exportErr.message}`);

    const { error: mealsErr } = await sb
        .from("meals")
        .delete()
        .eq("user_id", userId);
    if (mealsErr)
        throw new Error(`Failed to delete meals: ${mealsErr.message}`);

    const { error: tokensErr } = await sb
        .from("oauth_tokens")
        .delete()
        .eq("user_id", userId);
    if (tokensErr)
        throw new Error(`Failed to delete tokens: ${tokensErr.message}`);

    const { error: refreshErr } = await sb
        .from("refresh_tokens")
        .delete()
        .eq("user_id", userId);
    if (refreshErr)
        throw new Error(
            `Failed to delete refresh tokens: ${refreshErr.message}`,
        );

    const { error: authErr } = await sb
        .from("auth_codes")
        .delete()
        .eq("user_id", userId);
    if (authErr)
        throw new Error(`Failed to delete auth codes: ${authErr.message}`);

    const { error: userErr } = await sb.auth.admin.deleteUser(userId);
    if (userErr) throw new Error(`Failed to delete user: ${userErr.message}`);
}

// ---------- OAuth tokens ----------

export async function storeToken(token: string, userId: string): Promise<void> {
    const expiresAt = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error } = await getSupabase().from("oauth_tokens").upsert(
        {
            token,
            user_id: userId,
            expires_at: expiresAt,
        },
        { onConflict: "token" },
    );

    if (error) throw new Error(`Failed to store token: ${error.message}`);
}

export async function getUserIdByToken(token: string): Promise<string | null> {
    const { data, error } = await getSupabase()
        .from("oauth_tokens")
        .select("user_id")
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .single();

    if (error || !data) return null;
    return data.user_id as string;
}

// ---------- Auth codes ----------

export async function storeAuthCode(
    code: string,
    redirectUri: string,
    userId: string,
    codeChallenge?: string,
): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await getSupabase()
        .from("auth_codes")
        .insert({
            code,
            redirect_uri: redirectUri,
            user_id: userId,
            code_challenge: codeChallenge ?? null,
            expires_at: expiresAt,
        });

    if (error) throw new Error(`Failed to store auth code: ${error.message}`);
}

export interface AuthCodeData {
    code: string;
    redirect_uri: string;
    user_id: string;
    code_challenge: string | null;
}

export async function consumeAuthCode(
    code: string,
): Promise<AuthCodeData | null> {
    const now = new Date().toISOString();

    const { data, error } = await getSupabase()
        .from("auth_codes")
        .delete()
        .eq("code", code)
        .gt("expires_at", now)
        .select()
        .single();

    if (error || !data) return null;
    return data as AuthCodeData;
}

// ---------- Refresh tokens ----------

export async function storeRefreshToken(
    token: string,
    userId: string,
): Promise<void> {
    const expiresAt = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error } = await getSupabase().from("refresh_tokens").insert({
        token,
        user_id: userId,
        expires_at: expiresAt,
    });

    if (error)
        throw new Error(`Failed to store refresh token: ${error.message}`);
}

export async function consumeRefreshToken(
    token: string,
): Promise<string | null> {
    const { data, error } = await getSupabase()
        .from("refresh_tokens")
        .delete()
        .eq("token", token)
        .gt("expires_at", new Date().toISOString())
        .select("user_id")
        .single();

    if (error || !data) return null;
    return data.user_id as string;
}

// ---------- Public landing stats ----------

export interface LandingStats {
    food_logs: number;
    total_calories: number;
    total_protein_g: number;
    total_carbs_g: number;
    total_fat_g: number;
    timezones: number;
    // IANA names of every distinct timezone in use — drives the landing-page
    // world map. Aggregate-only; no per-user data.
    timezone_list: string[];
}

// Aggregate-only totals for the public landing page. Backed by the
// `public_landing_stats` SQL function so the whole thing is one round trip and
// the database does the summing. Never returns per-user rows.
export async function getLandingStats(): Promise<LandingStats> {
    const { data, error } = await getSupabase().rpc("public_landing_stats");
    if (error) throw new Error(`Failed to get landing stats: ${error.message}`);
    return data as LandingStats;
}

// ---------- Registered clients ----------

export function registerClient(
    clientName: string | null,
    redirectUris: string[],
): void {
    getSupabase()
        .from("registered_clients")
        .insert({
            client_name: clientName,
            redirect_uris: redirectUris,
        })
        .then(({ error }) => {
            if (error) {
                console.warn(
                    "Failed to persist client registration:",
                    error.message,
                );
            }
        });
}
