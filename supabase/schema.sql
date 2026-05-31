-- The ITI Café — schema Supabase
-- Esegui in SQL Editor del progetto Supabase (Dashboard → SQL)

-- Profilo giocatore (codename)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null default 'anon_dealer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Salvataggio partita (JSON GameState)
create table if not exists public.game_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Classifica globale
create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null,
  total_earned integer not null default 0,
  days_survived integer not null default 0,
  total_sold integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.game_saves enable row level security;
alter table public.leaderboard enable row level security;

-- Profiles: solo il proprio record
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Game saves: solo il proprio save
create policy "game_saves_select_own" on public.game_saves for select using (auth.uid() = user_id);
create policy "game_saves_insert_own" on public.game_saves for insert with check (auth.uid() = user_id);
create policy "game_saves_update_own" on public.game_saves for update using (auth.uid() = user_id);

-- Leaderboard: tutti leggono, solo owner scrive
create policy "leaderboard_select_all" on public.leaderboard for select using (true);
create policy "leaderboard_insert_own" on public.leaderboard for insert with check (auth.uid() = user_id);
create policy "leaderboard_update_own" on public.leaderboard for update using (auth.uid() = user_id);

-- Trigger profilo alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1), 'anon_dealer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Abilita OAuth in Dashboard → Authentication → Providers: Google, GitHub
-- Redirect URL: http://localhost:5173/auth/callback (dev) e la URL di produzione
