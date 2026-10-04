-- Composite index for per-user meal reads ordered by time. get_trends with
-- group_by reads up to five calendar years of a user's meals in one paged
-- window (getMealsInRange, ordered by logged_at then id); until now meals had
-- no (user_id, logged_at) index to serve that range scan.
--
-- Release order: safe in either order. The code works without the index (only
-- slower), and the index needs no code.
create index if not exists idx_meals_user_logged_at
    on public.meals (user_id, logged_at);
