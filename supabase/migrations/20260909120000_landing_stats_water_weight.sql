-- The landing page's live panel grew two cards — "Water logged" and
-- "Weight lost since July 2, 2026" — so the public stats function gains
-- the two aggregates behind them. Everything else is identical to
-- 20260815071050_landing_stats_exclude_unset_timezone.sql.
--
-- weight_lost_g is the net loss summed across every account with at least
-- two weigh-ins (first minus latest, by logged_at), floored at zero so a
-- site-wide net gain never renders as a negative "lost" figure. Aggregate
-- only, like everything else here: no per-user row leaves this function.
--
-- The app treats both keys as optional (LandingStats in src/supabase.ts)
-- so a deploy where the DB lags the app hides the two cards rather than
-- rendering NaN.
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
    'total_water_ml', (select coalesce(sum(amount_ml), 0) from public.water_log),
    'weight_lost_g',  (
      select greatest(coalesce(sum(first_g - last_g), 0), 0)
      from (
        select
          (array_agg(weight_g order by logged_at asc))[1]  as first_g,
          (array_agg(weight_g order by logged_at desc))[1] as last_g
        from public.weight_log
        group by user_id
        having count(*) >= 2
      ) w
    ),
    'timezones',      (select count(distinct timezone) from public.profiles),
    'timezone_list',  (select coalesce(json_agg(distinct timezone), '[]'::json) from public.profiles where timezone is not null),
    -- json_object_agg over zero rows yields NULL, not '{}', hence the coalesce.
    'timezone_counts',(
      select coalesce(json_object_agg(timezone, n), '{}'::json)
      from (
        select timezone, count(*)::int as n
        from public.profiles
        where timezone is not null
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
