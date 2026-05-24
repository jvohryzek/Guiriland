create table if not exists public.guiriland_scores (
  id bigint generated always as identity primary key,
  player_name text not null check (char_length(player_name) between 1 and 16),
  location_id text not null,
  location_name text not null,
  score integer not null check (score >= 0),
  guiris integer not null check (guiris >= 0),
  seconds_left integer not null check (seconds_left >= 0),
  locals_hit integer not null check (locals_hit >= 0),
  player_won boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.guiriland_scores enable row level security;

drop policy if exists "Leaderboard scores are visible" on public.guiriland_scores;
create policy "Leaderboard scores are visible"
on public.guiriland_scores
for select
to anon
using (true);

drop policy if exists "Anyone can submit a leaderboard score" on public.guiriland_scores;
create policy "Anyone can submit a leaderboard score"
on public.guiriland_scores
for insert
to anon
with check (
  location_id = 'la-rambla'
  and score between 0 and 5000
  and guiris between 0 and 10
  and seconds_left between 0 and 30
  and locals_hit between 0 and 20
);
