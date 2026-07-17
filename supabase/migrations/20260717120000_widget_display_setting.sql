-- Per-user toggle for whether in-chat MCP Apps widgets are shown. Default TRUE
-- keeps widgets enabled for everyone, including every existing profile row. A
-- user opts out via the set_widget_display tool; when disabled, the server omits
-- the tool→widget UI link for that user's session so hosts render no widget.
-- Covered by the existing "Users manage their own profile" RLS policy.
alter table public.profiles
    add column if not exists widgets_enabled boolean not null default true;
