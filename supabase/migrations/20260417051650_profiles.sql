-- User profiles. One row per user. Extend as needed; for now stores IANA timezone.
create table if not exists public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    timezone text not null default 'UTC',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users manage their own profile"
    on public.profiles
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
