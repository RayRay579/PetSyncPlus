create table if not exists public.memories (
  id text primary key,
  pet_id text,
  user_id uuid null,
  caption text not null default '',
  memory_type text not null default 'Memory',
  memory_date date,
  photo_url text,
  file_path text,
  milestone boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.memories to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('memory-vault', 'memory-vault', true)
on conflict (id) do update set public = excluded.public;

create policy "Public read memory vault files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'memory-vault');

create policy "Public insert memory vault files"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'memory-vault');

create policy "Public update memory vault files"
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'memory-vault')
with check (bucket_id = 'memory-vault');

create policy "Public delete memory vault files"
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'memory-vault');
