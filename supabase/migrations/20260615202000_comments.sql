create table if not exists public.comments (
  id text primary key,
  parent_type text not null,
  parent_id text not null,
  user_id uuid null,
  author text not null,
  text text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.comments to anon, authenticated;
