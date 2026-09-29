-- k-anonymity for the landing page's world map (brief 13).
--
-- /api/stats is public and unauthenticated, and it served timezone_list:
-- every distinct profile timezone, many of them held by exactly one profile.
-- "Somebody in Pacific/Apia uses this app" is a fact about one person, and the
-- privacy policy now promises that a timezone appears on the map only once at
-- least three profiles use it. So timezone_list and timezone_counts keep only
-- timezones with count(*) >= 3. src/supabase.ts (TZ_MIN_PROFILES) applies the
-- same threshold again before anything is served, so the app is safe whichever
-- of the two deploys first. Everything else is identical to
-- 20260909064651_landing_stats_water_weight.sql.
--
-- 'timezones' deliberately still counts every distinct timezone. It is one
-- site-wide number that names no timezone; set beside the filtered list it
-- tells a reader how many timezones fall below the threshold, never which, and
-- it is what the page's "Logged across N timezones" line has always shown.
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
    -- json_agg over zero rows yields NULL, not '[]', hence the coalesce.
    'timezone_list',  (
      select coalesce(json_agg(timezone order by timezone), '[]'::json)
      from (
        select timezone
        from public.profiles
        where timezone is not null
        group by timezone
        having count(*) >= 3
      ) shared_tz
    ),
    -- json_object_agg over zero rows yields NULL, not '{}', hence the coalesce.
    'timezone_counts',(
      select coalesce(json_object_agg(timezone, n), '{}'::json)
      from (
        select timezone, count(*)::int as n
        from public.profiles
        where timezone is not null
        group by timezone
        having count(*) >= 3
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

-- Dev check after applying: returns a row only if a timezone held by fewer
-- than three profiles still leaves the function. Expect zero rows.
--
--   with s as (select public.public_landing_stats() as j),
--   exposed as (
--     select json_array_elements_text(j -> 'timezone_list') as tz from s
--     union
--     select json_object_keys(j -> 'timezone_counts') from s
--   )
--   select e.tz, count(p.*) as profiles
--   from exposed e
--   left join public.profiles p on p.timezone = e.tz
--   group by e.tz
--   having count(p.*) < 3;
