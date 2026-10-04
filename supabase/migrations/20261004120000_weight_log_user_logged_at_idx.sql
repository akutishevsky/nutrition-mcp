-- Composite index for per-user weight reads ordered by time. get_weight_trends
-- now reads a user's whole weight history (getAllWeight, paged by logged_at)
-- to build the smoothed trend and the 90-day / 1-year / all-history series;
-- until now weight_log had only the single-column user_id and logged_at
-- indexes from 20260702120000_weight_tracking.sql.
--
-- Release order: safe in either order. The code works without the index (only
-- slower), and the index needs no code.
create index if not exists idx_weight_log_user_logged_at
    on public.weight_log (user_id, logged_at);
