-- Per-user preference: open in-chat widgets with their "Show more" detail
-- already expanded. Default FALSE keeps every existing profile on the collapsed
-- view. Set via set_widget_display's `expanded`; the server passes it to the
-- widget in the tool result's _meta (nutrition-mcp.com/widget-prefs).
-- Covered by the existing "Users manage their own profile" RLS policy.
alter table public.profiles
    add column if not exists widgets_expanded boolean not null default false;
