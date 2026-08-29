create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.business_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid(),
  category_id uuid references public.business_categories(id) on delete set null,
  name text not null,
  description text,
  phone text,
  email text,
  website text,
  business_tier text not null default 'free' check (business_tier in ('free', 'premium', 'featured', 'sponsor')),
  verified boolean not null default false,
  profile_views integer not null default 0,
  service_mode text not null default 'local_only' check (service_mode in ('local_only', 'online_only', 'hybrid')),
  service_radius_miles integer,
  online_service_url text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  address text,
  city text,
  state text,
  zip text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  hours_json jsonb not null default '{}'::jsonb,
  logo_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  is_featured boolean not null default false,
  featured_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  owner_reply text,
  owner_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text,
  promo_code text,
  button_text text,
  button_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'expired', 'rejected')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shelters (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid(),
  name text not null,
  description text,
  phone text,
  email text,
  website text,
  donation_url text,
  volunteer_url text,
  wishlist_url text,
  amazon_wishlist_url text,
  service_mode text not null default 'local_only' check (service_mode in ('local_only', 'online_only', 'hybrid')),
  service_radius_miles integer,
  online_service_url text,
  address text,
  city text,
  state text,
  zip text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  logo_url text,
  profile_views integer not null default 0,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adoptable_pets (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  age_label text,
  sex text,
  size text,
  weight text,
  description text,
  personality text,
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  house_trained boolean,
  medical_status text,
  adoption_fee numeric(10,2),
  views integer not null default 0,
  status text not null default 'pending' check (status in ('available', 'pending', 'adopted', 'hidden')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adoptable_pet_media (
  id uuid primary key default gen_random_uuid(),
  adoptable_pet_id uuid not null references public.adoptable_pets(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_events (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid(),
  host_type text not null check (host_type in ('business', 'shelter', 'community')),
  business_id uuid references public.businesses(id) on delete set null,
  shelter_id uuid references public.shelters(id) on delete set null,
  title text not null,
  description text,
  event_type text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  max_attendees integer,
  current_attendees integer not null default 0,
  registration_required boolean not null default false,
  registration_url text,
  address text,
  city text,
  state text,
  zip text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'active', 'cancelled', 'hidden')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pet_events_host_check check (
    (host_type = 'business' and business_id is not null and shelter_id is null)
    or (host_type = 'shelter' and shelter_id is not null and business_id is null)
    or (host_type = 'community' and business_id is null and shelter_id is null)
  )
);

create table if not exists public.discover_banner_ads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  image_url text not null,
  target_url text,
  placement text not null default 'discover',
  starts_at timestamptz,
  ends_at timestamptz,
  impressions integer not null default 0,
  clicks integer not null default 0,
  active boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'expired', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  favorite_type text not null check (favorite_type in ('business', 'shelter', 'adoptable_pet', 'pet_event')),
  favorite_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint favorites_unique unique (user_id, favorite_type, favorite_id)
);

create index if not exists idx_business_categories_active_sort on public.business_categories (active, sort_order, name);
create index if not exists idx_businesses_category_status on public.businesses (category_id, status);
create index if not exists idx_businesses_status_location on public.businesses (status, state, city);
create index if not exists idx_businesses_owner_user_id on public.businesses (owner_user_id);
create index if not exists idx_businesses_tier_status on public.businesses (business_tier, status);
create index if not exists idx_businesses_verified_status on public.businesses (verified, status);
create index if not exists idx_businesses_service_mode_status on public.businesses (service_mode, status);
create index if not exists idx_business_photos_business_sort on public.business_photos (business_id, sort_order);
create index if not exists idx_business_reviews_business_status on public.business_reviews (business_id, status, created_at desc);
create index if not exists idx_business_reviews_user_id on public.business_reviews (user_id);
create index if not exists idx_business_promotions_business_status on public.business_promotions (business_id, status, starts_at desc);
create index if not exists idx_business_promotions_status_start_end on public.business_promotions (status, starts_at, ends_at);
create index if not exists idx_shelters_status_location on public.shelters (status, state, city);
create index if not exists idx_shelters_owner_user_id on public.shelters (owner_user_id);
create index if not exists idx_shelters_service_mode_status on public.shelters (service_mode, status);
create index if not exists idx_adoptable_pets_shelter_status on public.adoptable_pets (shelter_id, status);
create index if not exists idx_adoptable_pets_species_status on public.adoptable_pets (species, status);
create index if not exists idx_adoptable_pets_status_created on public.adoptable_pets (status, created_at desc);
create index if not exists idx_adoptable_pet_media_pet_sort on public.adoptable_pet_media (adoptable_pet_id, sort_order);
create index if not exists idx_pet_events_host_status_start on public.pet_events (host_type, status, starts_at);
create index if not exists idx_pet_events_location_status on public.pet_events (status, state, city);
create index if not exists idx_pet_events_owner_user_id on public.pet_events (owner_user_id);
create index if not exists idx_pet_events_status_start on public.pet_events (status, starts_at);
create index if not exists idx_discover_banner_ads_placement_status_start on public.discover_banner_ads (placement, status, starts_at);
create index if not exists idx_discover_banner_ads_business_status on public.discover_banner_ads (business_id, status);
create index if not exists idx_favorites_user_type_id on public.favorites (user_id, favorite_type, favorite_id);

drop trigger if exists trg_business_categories_updated_at on public.business_categories;
create trigger trg_business_categories_updated_at
before update on public.business_categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_businesses_updated_at on public.businesses;
create trigger trg_businesses_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists trg_business_photos_updated_at on public.business_photos;
create trigger trg_business_photos_updated_at
before update on public.business_photos
for each row execute function public.set_updated_at();

drop trigger if exists trg_business_reviews_updated_at on public.business_reviews;
create trigger trg_business_reviews_updated_at
before update on public.business_reviews
for each row execute function public.set_updated_at();

drop trigger if exists trg_business_promotions_updated_at on public.business_promotions;
create trigger trg_business_promotions_updated_at
before update on public.business_promotions
for each row execute function public.set_updated_at();

drop trigger if exists trg_shelters_updated_at on public.shelters;
create trigger trg_shelters_updated_at
before update on public.shelters
for each row execute function public.set_updated_at();

drop trigger if exists trg_adoptable_pets_updated_at on public.adoptable_pets;
create trigger trg_adoptable_pets_updated_at
before update on public.adoptable_pets
for each row execute function public.set_updated_at();

drop trigger if exists trg_adoptable_pet_media_updated_at on public.adoptable_pet_media;
create trigger trg_adoptable_pet_media_updated_at
before update on public.adoptable_pet_media
for each row execute function public.set_updated_at();

drop trigger if exists trg_pet_events_updated_at on public.pet_events;
create trigger trg_pet_events_updated_at
before update on public.pet_events
for each row execute function public.set_updated_at();

drop trigger if exists trg_discover_banner_ads_updated_at on public.discover_banner_ads;
create trigger trg_discover_banner_ads_updated_at
before update on public.discover_banner_ads
for each row execute function public.set_updated_at();

drop trigger if exists trg_favorites_updated_at on public.favorites;
create trigger trg_favorites_updated_at
before update on public.favorites
for each row execute function public.set_updated_at();

alter table public.business_categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_photos enable row level security;
alter table public.business_reviews enable row level security;
alter table public.business_promotions enable row level security;
alter table public.shelters enable row level security;
alter table public.adoptable_pets enable row level security;
alter table public.adoptable_pet_media enable row level security;
alter table public.pet_events enable row level security;
alter table public.discover_banner_ads enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Business categories are publicly readable when active" on public.business_categories;
create policy "Business categories are publicly readable when active"
on public.business_categories
for select
to anon, authenticated
using (active = true);

drop policy if exists "Businesses are publicly readable when approved" on public.businesses;
create policy "Businesses are publicly readable when approved"
on public.businesses
for select
to anon, authenticated
using (
  (
    status = 'approved'
    and deleted_at is null
  )
  or owner_user_id = auth.uid()
);
drop policy if exists "Businesses can be inserted by their owner" on public.businesses;
create policy "Businesses can be inserted by their owner"
on public.businesses
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Businesses can be updated by their owner" on public.businesses;
create policy "Businesses can be updated by their owner"
on public.businesses
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Businesses can be deleted by their owner" on public.businesses;
create policy "Businesses can be deleted by their owner"
on public.businesses
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Business photos are publicly readable for approved businesses" on public.business_photos;
create policy "Business photos are publicly readable for approved businesses"
on public.business_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
  or (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'approved'
    )
  )
);

drop policy if exists "Business photos can be managed by business owners" on public.business_photos;
create policy "Business photos can be managed by business owners"
on public.business_photos
for all
to authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Business reviews are publicly readable when approved" on public.business_reviews;
create policy "Business reviews are publicly readable when approved"
on public.business_reviews
for select
to anon, authenticated
using (
  user_id = auth.uid()
  or (
    status = 'approved'
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'approved'
    )
  )
);

drop policy if exists "Business reviews can be created by authenticated users" on public.business_reviews;
create policy "Business reviews can be created by authenticated users"
on public.business_reviews
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Business reviews can be updated by their author" on public.business_reviews;
create policy "Business reviews can be updated by their author"
on public.business_reviews
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Business reviews can be deleted by their author" on public.business_reviews;
create policy "Business reviews can be deleted by their author"
on public.business_reviews
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Business promotions are publicly readable when active" on public.business_promotions;
create policy "Business promotions are publicly readable when active"
on public.business_promotions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
  or (
status = 'active'
and deleted_at is null
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.status = 'approved'
    )
  )
);

drop policy if exists "Business promotions can be managed by business owners" on public.business_promotions;
create policy "Business promotions can be managed by business owners"
on public.business_promotions
for all
to authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Shelters are publicly readable when approved" on public.shelters;
create policy "Shelters are publicly readable when approved"
on public.shelters
for select
to anon, authenticated
using (
  (
    status = 'approved'
    and deleted_at is null
  )
  or owner_user_id = auth.uid()
);
drop policy if exists "Shelters can be inserted by their owner" on public.shelters;
create policy "Shelters can be inserted by their owner"
on public.shelters
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "Shelters can be updated by their owner" on public.shelters;
create policy "Shelters can be updated by their owner"
on public.shelters
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "Shelters can be deleted by their owner" on public.shelters;
create policy "Shelters can be deleted by their owner"
on public.shelters
for delete
to authenticated
using (owner_user_id = auth.uid());

drop policy if exists "Adoptable pets are publicly readable when available" on public.adoptable_pets;
create policy "Adoptable pets are publicly readable when available"
on public.adoptable_pets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.shelters s
    where s.id = shelter_id
      and s.owner_user_id = auth.uid()
  )
  or (
status = 'available'
and deleted_at is null
    and exists (
      select 1
      from public.shelters s
      where s.id = shelter_id
        and s.status = 'approved'
    )
  )
);

drop policy if exists "Adoptable pets can be managed by shelter owners" on public.adoptable_pets;
create policy "Adoptable pets can be managed by shelter owners"
on public.adoptable_pets
for all
to authenticated
using (
  exists (
    select 1
    from public.shelters s
    where s.id = shelter_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shelters s
    where s.id = shelter_id
      and s.owner_user_id = auth.uid()
  )
);

drop policy if exists "Adoptable pet media are publicly readable when parent pet is available" on public.adoptable_pet_media;
create policy "Adoptable pet media are publicly readable when parent pet is available"
on public.adoptable_pet_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.adoptable_pets p
    join public.shelters s on s.id = p.shelter_id
    where p.id = adoptable_pet_id
      and p.status = 'available'
      and s.status = 'approved'
  )
  or exists (
    select 1
    from public.adoptable_pets p
    join public.shelters s on s.id = p.shelter_id
    where p.id = adoptable_pet_id
      and s.owner_user_id = auth.uid()
  )
);

drop policy if exists "Adoptable pet media can be managed by shelter owners" on public.adoptable_pet_media;
create policy "Adoptable pet media can be managed by shelter owners"
on public.adoptable_pet_media
for all
to authenticated
using (
  exists (
    select 1
    from public.adoptable_pets p
    join public.shelters s on s.id = p.shelter_id
    where p.id = adoptable_pet_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.adoptable_pets p
    join public.shelters s on s.id = p.shelter_id
    where p.id = adoptable_pet_id
      and s.owner_user_id = auth.uid()
  )
);

drop policy if exists "Pet events are publicly readable when active" on public.pet_events;
create policy "Pet events are publicly readable when active"
on public.pet_events
for select
to anon, authenticated
using (
  owner_user_id = auth.uid()
  or (
    host_type = 'business'
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_user_id = auth.uid()
    )
  )
  or (
    host_type = 'shelter'
    and exists (
      select 1
      from public.shelters s
      where s.id = shelter_id
        and s.owner_user_id = auth.uid()
    )
  )
  or (
status = 'active'
and deleted_at is null    and (
      host_type = 'community'
      or (
        host_type = 'business'
        and exists (
          select 1
          from public.businesses b
          where b.id = business_id
            and b.status = 'approved'
        )
      )
      or (
        host_type = 'shelter'
        and exists (
          select 1
          from public.shelters s
          where s.id = shelter_id
            and s.status = 'approved'
        )
      )
    )
  )
);

drop policy if exists "Pet events can be managed by their owner or host owner" on public.pet_events;
create policy "Pet events can be managed by their owner or host owner"
on public.pet_events
for all
to authenticated
using (
  owner_user_id = auth.uid()
  or (
    host_type = 'business'
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_user_id = auth.uid()
    )
  )
  or (
    host_type = 'shelter'
    and exists (
      select 1
      from public.shelters s
      where s.id = shelter_id
        and s.owner_user_id = auth.uid()
    )
  )
)
with check (
  owner_user_id = auth.uid()
  or (
    host_type = 'business'
    and exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_user_id = auth.uid()
    )
  )
  or (
    host_type = 'shelter'
    and exists (
      select 1
      from public.shelters s
      where s.id = shelter_id
        and s.owner_user_id = auth.uid()
    )
  )
);

drop policy if exists "Discover banner ads are publicly readable when active" on public.discover_banner_ads;
create policy "Discover banner ads are publicly readable when active"
on public.discover_banner_ads
for select
to anon, authenticated
using (
  active = true
  and status = 'active'
  or exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Discover banner ads can be managed by business owners" on public.discover_banner_ads;
create policy "Discover banner ads can be managed by business owners"
on public.discover_banner_ads
for all
to authenticated
using (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_user_id = auth.uid()
  )
);

drop policy if exists "Favorites can be read by their owner" on public.favorites;
create policy "Favorites can be read by their owner"
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Favorites can be created by their owner" on public.favorites;
create policy "Favorites can be created by their owner"
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Favorites can be deleted by their owner" on public.favorites;
create policy "Favorites can be deleted by their owner"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());

grant select on table public.business_categories to anon, authenticated;
grant select on table public.businesses to anon, authenticated;
grant insert, update, delete on table public.businesses to authenticated;
grant select on table public.business_photos to anon, authenticated;
grant insert, update, delete on table public.business_photos to authenticated;
grant select on table public.business_reviews to anon, authenticated;
grant insert, update, delete on table public.business_reviews to authenticated;
grant select on table public.business_promotions to anon, authenticated;
grant insert, update, delete on table public.business_promotions to authenticated;
grant select on table public.shelters to anon, authenticated;
grant insert, update, delete on table public.shelters to authenticated;
grant select on table public.adoptable_pets to anon, authenticated;
grant insert, update, delete on table public.adoptable_pets to authenticated;
grant select on table public.adoptable_pet_media to anon, authenticated;
grant insert, update, delete on table public.adoptable_pet_media to authenticated;
grant select on table public.pet_events to anon, authenticated;
grant insert, update, delete on table public.pet_events to authenticated;
grant select on table public.discover_banner_ads to anon, authenticated;
grant insert, update, delete on table public.discover_banner_ads to authenticated;
grant select on table public.favorites to authenticated;
grant insert, delete on table public.favorites to authenticated;
