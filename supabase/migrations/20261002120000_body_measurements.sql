-- Body measurements (circumferences). One row per measurement; several per day
-- are allowed. Stored canonically as integer millimetres (value_mm) so cm/in
-- conversion happens server-side without float drift; value_entered and
-- entered_unit keep exactly what the user typed, so a display in the unit they
-- used shows their own number back rather than a round-tripped one.
-- One value per site: there is no left/right column — a side goes in notes.
--
-- Release order: apply to dev before the code reaches `dev`, and to production
-- before it reaches `main` (merging to main deploys). Every new tool would
-- otherwise fail on a missing relation, and set_length_unit on a missing column.
create table if not exists public.body_measurement_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    kind text not null
        constraint body_measurement_log_kind_check
        check (kind in ('waist', 'hips', 'neck', 'chest', 'shoulders',
                        'upper_arm', 'forearm', 'thigh', 'calf')),
    value_mm integer not null check (value_mm > 0),
    value_entered numeric not null check (value_entered > 0),
    entered_unit text not null check (entered_unit in ('cm', 'in')),
    logged_at timestamptz not null default now(),
    notes text,
    created_at timestamptz not null default now(),
    idempotency_key text
);

create index if not exists idx_body_measurement_log_user_logged_at
    on public.body_measurement_log (user_id, logged_at);

create unique index if not exists uniq_body_measurement_log_user_idem
    on public.body_measurement_log (user_id, idempotency_key)
    where idempotency_key is not null;

alter table public.body_measurement_log enable row level security;

-- Same own-rows policy as weight_log, scoped to `authenticated` so it never
-- applies to anon (see 20260726130000_restrict_service_role_policies.sql).
create policy "Users manage their own body_measurement_log"
    on public.body_measurement_log
    for all
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

grant all on table public.body_measurement_log to service_role;

-- Preferred unit for body measurements. Nullable with NO default, mirroring
-- preferred_weight_unit (20260702120000_weight_tracking.sql): NULL means
-- "never chosen", so write paths refuse to guess cm vs in. Never derived from
-- the weight unit.
alter table public.profiles
    add column if not exists preferred_length_unit text
        check (preferred_length_unit is null or preferred_length_unit in ('cm', 'in'));
