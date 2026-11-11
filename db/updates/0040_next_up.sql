-- Next up (Today guidance rework, 2026-11-10 brief D1–D7): the home
-- guidance panel stops restating the day and starts suggesting the
-- next meal. Composition (one model call per refresh) is cached per
-- user + local date + day-part, keyed by a fingerprint of the exact
-- context it was composed from — a meal log, plan change, pantry
-- change, or grocery change moves the fingerprint and the next view
-- recomposes (brief D4). The cache stores only the model's validated
-- pick; all numbers are recomputed from live context on every read.
create table if not exists munch.next_up_cache (
    user_id uuid not null references munch.users(id) on delete cascade,
    local_date date not null,
    day_part text not null,
    fingerprint text not null,
    composition jsonb not null,
    created_at timestamptz not null default now(),
    primary key (user_id, local_date, day_part),
    constraint next_up_cache_day_part check (
        day_part in ('morning', 'midday', 'evening')
    ),
    constraint next_up_cache_composition_object check (
        jsonb_typeof(composition) = 'object'
    )
);

alter table munch.next_up_cache enable row level security;
alter table munch.next_up_cache force row level security;

drop policy if exists next_up_cache_app_self on munch.next_up_cache;
create policy next_up_cache_app_self
    on munch.next_up_cache
    for all to munch_app using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());
drop policy if exists next_up_cache_auth_self on munch.next_up_cache;
create policy next_up_cache_auth_self
    on munch.next_up_cache
    for all to munch_auth using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

grant select, insert, update, delete
    on munch.next_up_cache to munch_app, munch_auth;

-- D6: the "Set a goal" on-ramp in the collapsed Next up state is a
-- one-time affordance. Once the user dismisses it, it never renders
-- again (an objective set through any flow also retires it, since the
-- prompt only shows while no objective is set). Defaults false:
-- accounts that never set an objective see the prompt once.
alter table munch.account_preferences
    add column if not exists next_up_goal_prompt_dismissed boolean not null default false;
