-- Append-only AI task credit ledger (S1, Full Parity App Program §2).
-- Balance is derived from entries; there is no mutable counter.
-- kind 'grant' (+), 'spend' (-), 'refund' (+, linked to its spend).
-- pool_user_id is the account whose monthly grant funds the spend: the
-- household owner's id when the actor belongs to a household, else the
-- actor's own id. actor_user_id is who performed the task.

create table if not exists munch.ai_credit_ledger (
    id uuid primary key default gen_random_uuid(),
    pool_user_id uuid not null references munch.users(id) on delete cascade,
    actor_user_id uuid not null references munch.users(id) on delete cascade,
    kind text not null check (kind in ('grant', 'spend', 'refund')),
    amount integer not null check (amount > 0),
    task text check (
        task is null
        or task in (
            'receipt_scan',
            'pantry_photo_scan',
            'meal_photo_log',
            'meal_ideas',
            'recipe_import',
            'plan_generation',
            'weekly_guidance',
            'cook_nl_fallback'
        )
    ),
    period_month char(7) not null check (period_month ~ '^\d{4}-\d{2}$'),
    idempotency_key text check (
        idempotency_key is null or length(idempotency_key) between 1 and 200
    ),
    related_entry_id uuid references munch.ai_credit_ledger(id) on delete cascade,
    model text,
    input_tokens integer check (input_tokens is null or input_tokens >= 0),
    output_tokens integer check (output_tokens is null or output_tokens >= 0),
    created_at timestamptz not null default now(),
    constraint ai_credit_ledger_grant_shape check (
        (kind = 'grant' and task is null and related_entry_id is null)
        or (kind = 'spend' and task is not null and related_entry_id is null)
        or (kind = 'refund' and task is not null and related_entry_id is not null)
    )
);

create index if not exists ai_credit_ledger_pool_period_idx
    on munch.ai_credit_ledger (pool_user_id, period_month, created_at);

-- One monthly grant per pool.
create unique index if not exists ai_credit_ledger_grant_unique
    on munch.ai_credit_ledger (pool_user_id, period_month)
    where kind = 'grant';

-- A spend is charged at most once per (pool, idempotency key).
create unique index if not exists ai_credit_ledger_spend_idempotency_unique
    on munch.ai_credit_ledger (pool_user_id, idempotency_key)
    where kind = 'spend' and idempotency_key is not null;

-- A spend is refunded at most once.
create unique index if not exists ai_credit_ledger_refund_unique
    on munch.ai_credit_ledger (related_entry_id)
    where kind = 'refund' and related_entry_id is not null;

alter table munch.ai_credit_ledger enable row level security;
alter table munch.ai_credit_ledger force row level security;

-- App role: a user sees their own pool, rows they acted in, and the pool of
-- a household they actively belong to (the owner's pool funds members).
drop policy if exists ai_credit_ledger_app_select on munch.ai_credit_ledger;
create policy ai_credit_ledger_app_select
    on munch.ai_credit_ledger
    for select
    to munch_app
    using (
        pool_user_id = munch.current_user_id()
        or actor_user_id = munch.current_user_id()
        or exists (
            select 1
            from munch.household_memberships membership
            join munch.households household
              on household.id = membership.household_id
            where membership.user_id = munch.current_user_id()
              and membership.status = 'active'
              and household.owner_user_id = munch.ai_credit_ledger.pool_user_id
              and household.archived_at is null
        )
    );

drop policy if exists ai_credit_ledger_app_insert on munch.ai_credit_ledger;
create policy ai_credit_ledger_app_insert
    on munch.ai_credit_ledger
    for insert
    to munch_app
    with check (actor_user_id = munch.current_user_id());

drop policy if exists ai_credit_ledger_billing_all on munch.ai_credit_ledger;
create policy ai_credit_ledger_billing_all
    on munch.ai_credit_ledger
    for all
    to munch_billing
    using (true)
    with check (true);

drop policy if exists ai_credit_ledger_auth_all on munch.ai_credit_ledger;
create policy ai_credit_ledger_auth_all
    on munch.ai_credit_ledger
    for all
    to munch_auth
    using (true)
    with check (true);

grant select, insert on munch.ai_credit_ledger to munch_app;
grant select, insert, update, delete on munch.ai_credit_ledger to munch_billing;
grant select, insert, update, delete on munch.ai_credit_ledger to munch_auth;

comment on table munch.ai_credit_ledger is
    'Append-only AI task credit ledger; balance is derived, spends are reserved before the model call and refunded on failure.';
