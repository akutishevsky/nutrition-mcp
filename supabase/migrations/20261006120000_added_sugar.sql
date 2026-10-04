-- Added sugar: a per-meal added-sugar amount beside total sugar, and its own
-- optional daily ceiling.
--
-- Why: the only sugar goal, daily_sugar_g, is a ceiling on TOTAL sugar, and no
-- health authority sets one. WHO limits free sugars, AHA and the US dietary
-- guidelines limit added sugars, so a user who types in the 25 g they read
-- about had it "used up" by two bananas. Labels give total sugar everywhere
-- but added sugar only in the US, so total stays and added is tracked beside
-- it.
--
-- Definition (the US label one): sugars added during processing or
-- preparation — table sugar, syrups, honey, sugar in sweetened drinks and
-- foods. Sugar naturally present in whole fruit, vegetables and plain milk is
-- not added, and neither is 100% fruit juice (it still counts in total sugar).
--
-- Every statement is additive and every new column nullable, so this is safe
-- on the populated production tables and lands BEFORE the server that writes
-- these columns (the reverse order breaks every insert).

-- Bare numeric, like the sibling per-meal nutrient columns. NULL means "not
-- recorded", never zero: meals logged before this column existed stay NULL,
-- and read paths leave such a day out of the added-sugar average and limit.
--
-- There is deliberately no check that added_sugar_g <= sugar_g. The app
-- enforces it (log_meal, update_meal, bulk import), where it can produce a
-- readable error naming both values; a constraint violation here would
-- surface as an opaque insert failure.
alter table public.meals
    add column if not exists added_sugar_g numeric check (added_sugar_g >= 0);

-- Optional daily ceiling, typed like daily_sugar_g. Zero is meaningful — an
-- added-sugar limit of 0 g means "none", which is what the US guidelines
-- recommend — so the check allows it.
alter table public.nutrition_goals
    add column if not exists daily_added_sugar_g numeric(6, 2) check (daily_added_sugar_g >= 0);

-- Goals history carries every goal column (see GOAL_COLUMNS in
-- src/goals-history.ts). No backfill: rows recorded before this change simply
-- have no added-sugar goal, which is what was in effect at the time.
alter table public.nutrition_goals_history
    add column if not exists daily_added_sugar_g numeric(6, 2) check (daily_added_sugar_g >= 0);

-- Per-user data: exported (meals.csv's added_sugar_g, goals.csv and
-- goals_history.csv's daily_added_sugar_g), named in the privacy policy, and
-- deleted with the rows that carry it by deleteAllUserData.
