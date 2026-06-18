create table if not exists public.memory_vault_items (
  id text primary key,
  "petId" text,
  "userId" uuid null,
  title text not null default '',
  description text not null default '',
  "mediaType" text not null default '',
  "storagePath" text,
  "publicUrl" text,
  "createdAt" timestamptz not null default now()
);

grant select, insert, update, delete on table public.memory_vault_items to anon, authenticated;
