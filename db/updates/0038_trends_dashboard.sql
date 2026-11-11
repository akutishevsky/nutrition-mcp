-- Trends (2026-11-10): the customizable analytics dashboard stores one
-- layout per account — an ordered list of {shape, data, size} cards —
-- so web, Android and iOS render the same dashboard (brief T9). Modeled
-- on guidance_preferences (0032): one row per user, versioned, with a
-- jsonb payload whose shape is validated in src/trends.ts.
create table munch.trends_dashboard_layouts (
    user_id uuid primary key references munch.users(id) on delete cascade,
    layout jsonb not null default '{"version": 1, "cards": []}'::jsonb,
    version integer not null default 1,
    updated_at timestamptz not null default now(),
    constraint trends_dashboard_layouts_object check (
        jsonb_typeof(layout) = 'object'
    ),
    constraint trends_dashboard_layouts_version check (version > 0)
);

alter table munch.trends_dashboard_layouts enable row level security;
alter table munch.trends_dashboard_layouts force row level security;

create policy trends_dashboard_layouts_app_self
    on munch.trends_dashboard_layouts
    for all to munch_app using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());
create policy trends_dashboard_layouts_auth_self
    on munch.trends_dashboard_layouts
    for all to munch_auth using (user_id = munch.current_user_id())
    with check (user_id = munch.current_user_id());

grant select, insert, update, delete
    on munch.trends_dashboard_layouts to munch_app, munch_auth;
