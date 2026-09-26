-- Manually delete a user and all associated data, mirroring
-- deleteAllUserData() in src/supabase.ts. SECURITY DEFINER so it can
-- reach auth.users. Returns a per-table row count.
--
-- NOTE: the meal-export file in the "exports" storage bucket is NOT
-- removed here -- storage.objects blocks direct SQL deletes via a
-- protect_delete() trigger. Remove '<user_id>/meals.csv' via the
-- Storage UI/API separately if needed.
create or replace function public.delete_user_account(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_analytics   int;
    v_water       int;
    v_goals       int;
    v_profiles    int;
    v_meals       int;
    v_oauth       int;
    v_refresh     int;
    v_auth_codes  int;
    v_user        int;
begin
    -- tool_analytics.user_id is varchar, not a uuid FK -> cast to text
    with d as (
        delete from public.tool_analytics
        where user_id = p_user_id::text returning 1)
    select count(*) into v_analytics from d;

    with d as (
        delete from public.water_log
        where user_id = p_user_id returning 1)
    select count(*) into v_water from d;

    with d as (
        delete from public.nutrition_goals
        where user_id = p_user_id returning 1)
    select count(*) into v_goals from d;

    with d as (
        delete from public.profiles
        where user_id = p_user_id returning 1)
    select count(*) into v_profiles from d;

    with d as (
        delete from public.meals
        where user_id = p_user_id returning 1)
    select count(*) into v_meals from d;

    with d as (
        delete from public.oauth_tokens
        where user_id = p_user_id returning 1)
    select count(*) into v_oauth from d;

    with d as (
        delete from public.refresh_tokens
        where user_id = p_user_id returning 1)
    select count(*) into v_refresh from d;

    with d as (
        delete from public.auth_codes
        where user_id = p_user_id returning 1)
    select count(*) into v_auth_codes from d;

    -- Finally the auth user (cascades within the auth schema:
    -- identities, sessions, etc.)
    with d as (
        delete from auth.users
        where id = p_user_id returning 1)
    select count(*) into v_user from d;

    return jsonb_build_object(
        'user_id',        p_user_id,
        'tool_analytics', v_analytics,
        'water_log',      v_water,
        'nutrition_goals',v_goals,
        'profiles',       v_profiles,
        'meals',          v_meals,
        'oauth_tokens',   v_oauth,
        'refresh_tokens', v_refresh,
        'auth_codes',     v_auth_codes,
        'auth_user',      v_user,
        'exports_note',   'storage file <user_id>/meals.csv must be deleted via Storage API'
    );
end;
$$;

revoke all on function public.delete_user_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_user_account(uuid) to service_role;
