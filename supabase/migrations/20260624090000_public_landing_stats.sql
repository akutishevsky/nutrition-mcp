-- Read-only aggregate for the public landing page. Returns global, non-personal
-- totals in a single round trip. SECURITY DEFINER so it can read across all rows
-- regardless of RLS; it exposes only aggregates, never individual rows.
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
    'timezone_list',  (select coalesce(json_agg(distinct timezone), '[]'::json) from public.profiles)
  );
$$;

comment on function public.public_landing_stats() is
  'Aggregate-only stats for the public landing page. Exposes no per-user rows.';

-- Only the server (service-role) calls this; it never needs to be reachable
-- directly via the anon/authenticated PostgREST roles.
revoke execute on function public.public_landing_stats() from public;
grant execute on function public.public_landing_stats() to service_role;
