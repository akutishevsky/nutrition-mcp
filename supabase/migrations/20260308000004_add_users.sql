-- Users table (auto-created on first OAuth connection)
create table users (
    id uuid primary key default gen_random_uuid(),
    name text,
    created_at timestamptz not null default now()
);

-- Add user_id to meals
alter table meals add column user_id uuid references users(id);
create index idx_meals_user_id on meals (user_id);

-- Add user_id to oauth_tokens
alter table oauth_tokens add column user_id uuid references users(id);
create index idx_oauth_tokens_user_id on oauth_tokens (user_id);
