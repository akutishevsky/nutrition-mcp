import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient;

export function getSupabase(): SupabaseClient {
    if (!supabase) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SECRET_KEY;
        if (!url || !key) {
            throw new Error(
                "Missing SUPABASE_URL or SUPABASE_SECRET_KEY",
            );
        }
        supabase = createClient(url, key);
    }
    return supabase;
}

// ---------- Users ----------

export async function createUser(): Promise<string> {
    const { data, error } = await getSupabase()
        .from("users")
        .insert({})
        .select("id")
        .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);
    return data.id as string;
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
}

export interface MealInput {
    description: string;
    meal_type?: "breakfast" | "lunch" | "dinner" | "snack";
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    logged_at?: string;
    notes?: string;
}

export async function insertMeal(
    userId: string,
    input: MealInput,
): Promise<Meal> {
    const { data, error } = await getSupabase()
        .from("meals")
        .insert({
            user_id: userId,
            description: input.description,
            meal_type: input.meal_type ?? null,
            calories: input.calories ?? null,
            protein_g: input.protein_g ?? null,
            carbs_g: input.carbs_g ?? null,
            fat_g: input.fat_g ?? null,
            logged_at: input.logged_at ?? new Date().toISOString(),
            notes: input.notes ?? null,
        })
        .select()
        .single();

    if (error) throw new Error(`Failed to insert meal: ${error.message}`);
    return data as Meal;
}

export async function getMealsByDate(
    userId: string,
    date: string,
): Promise<Meal[]> {
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", startOfDay)
        .lte("logged_at", endOfDay)
        .order("logged_at", { ascending: true });

    if (error) throw new Error(`Failed to get meals: ${error.message}`);
    return (data as Meal[]) ?? [];
}

export async function getMealsInRange(
    userId: string,
    startDate: string,
    endDate: string,
): Promise<Meal[]> {
    const { data, error } = await getSupabase()
        .from("meals")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", `${startDate}T00:00:00`)
        .lte("logged_at", `${endDate}T23:59:59`)
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
        update.description = fields.description;
    if (fields.meal_type !== undefined) update.meal_type = fields.meal_type;
    if (fields.calories !== undefined) update.calories = fields.calories;
    if (fields.protein_g !== undefined) update.protein_g = fields.protein_g;
    if (fields.carbs_g !== undefined) update.carbs_g = fields.carbs_g;
    if (fields.fat_g !== undefined) update.fat_g = fields.fat_g;
    if (fields.logged_at !== undefined) update.logged_at = fields.logged_at;
    if (fields.notes !== undefined) update.notes = fields.notes;

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

// ---------- OAuth tokens ----------

export async function storeToken(
    token: string,
    userId: string,
): Promise<void> {
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

export async function getUserIdByToken(
    token: string,
): Promise<string | null> {
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
    codeChallenge?: string,
): Promise<void> {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await getSupabase()
        .from("auth_codes")
        .insert({
            code,
            redirect_uri: redirectUri,
            code_challenge: codeChallenge ?? null,
            expires_at: expiresAt,
        });

    if (error) throw new Error(`Failed to store auth code: ${error.message}`);
}

export interface AuthCodeData {
    code: string;
    redirect_uri: string;
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
