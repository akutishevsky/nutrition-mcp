-- Adds per-timezone profile counts to the landing stats, so the world map can
-- size each dot by that timezone's share of all profiles instead of drawing
-- every dot at one radius.
--
-- Additive on purpose: `timezone_list` stays. Removing it here would break the
-- landing page already in production the moment this runs, since the deployed
-- JS reads that key — and browsers hold the old HTML for a while after a
-- deploy. It can be dropped in a later migration once nothing reads it.
--
-- `timezone_counts` is exact and is NOT what the public endpoint serves:
-- src/supabase.ts buckets it into five levels and exposes only those, because
-- a raw count publishes "exactly one person uses this app in Pacific/Apia" on
-- an unauthenticated route.
create or replace function public.public_landing_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'food_logs',      (select count(*) from public.meals),
    'total_calories', (select coalesce(sum(calories), 0) from public.meals),
    'total_protein_g',(select coalesce(sum(protein_g), 0) from public.meals),
    'total_carbs_g',  (select coalesce(sum(carbs_g), 0) from public.meals),
    'total_fat_g',    (select coalesce(sum(fat_g), 0) from public.meals),
    'timezones',      (select count(distinct timezone) from public.profiles),
    'timezone_list',  (select coalesce(json_agg(distinct timezone), '[]'::json) from public.profiles),
    -- json_object_agg over zero rows yields NULL, not '{}', hence the coalesce.
    'timezone_counts',(
      select coalesce(json_object_agg(timezone, n), '{}'::json)
      from (
        select timezone, count(*)::int as n
        from public.profiles
        group by timezone
      ) per_tz
    )
  );
$$;

comment on function public.public_landing_stats() is
  'Aggregate-only stats for the public landing page. Exposes no per-user rows.';

-- Only the server (service-role) calls this; it never needs to be reachable
-- directly via the anon/authenticated PostgREST roles.
revoke execute on function public.public_landing_stats() from public;
grant execute on function public.public_landing_stats() to service_role;
