create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  member_email text not null,
  role text not null default 'Viewer',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.family_members to anon, authenticated;
