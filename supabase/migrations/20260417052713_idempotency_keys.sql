-- Optional idempotency keys for logging tools. Clients can pass a stable
-- random string with a retry-safe write; a partial unique index ensures a
-- second call with the same (user_id, idempotency_key) returns the original
-- row instead of creating a duplicate. Keys are opt-in; existing rows stay.

alter table public.meals
    add column if not exists idempotency_key text;

alter table public.water_log
    add column if not exists idempotency_key text;

create unique index if not exists uniq_meals_user_idem
    on public.meals (user_id, idempotency_key)
    where idempotency_key is not null;

create unique index if not exists uniq_water_log_user_idem
    on public.water_log (user_id, idempotency_key)
    where idempotency_key is not null;
