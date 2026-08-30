alter table public.profiles enable row level security;
alter table public.push_tokens enable row level security;
alter table public.lost_pet_alerts enable row level security;

drop policy if exists "profiles authenticated read" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles delete own" on public.profiles;
create policy "profiles authenticated read" on public.profiles for select to authenticated using (true);
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles delete own" on public.profiles for delete to authenticated using (id = auth.uid());

drop policy if exists "push tokens read own" on public.push_tokens;
drop policy if exists "push tokens insert own" on public.push_tokens;
drop policy if exists "push tokens update own" on public.push_tokens;
drop policy if exists "push tokens delete own" on public.push_tokens;
create policy "push tokens read own" on public.push_tokens for select to authenticated using (user_id = auth.uid());
create policy "push tokens insert own" on public.push_tokens for insert to authenticated with check (user_id = auth.uid());
create policy "push tokens update own" on public.push_tokens for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "push tokens delete own" on public.push_tokens for delete to authenticated using (user_id = auth.uid());

drop policy if exists "lost pet alerts authenticated read" on public.lost_pet_alerts;
drop policy if exists "lost pet alerts insert own" on public.lost_pet_alerts;
drop policy if exists "lost pet alerts update own" on public.lost_pet_alerts;
drop policy if exists "lost pet alerts delete own" on public.lost_pet_alerts;
create policy "lost pet alerts authenticated read" on public.lost_pet_alerts for select to authenticated using (true);
create policy "lost pet alerts insert own" on public.lost_pet_alerts for insert to authenticated with check (user_id = auth.uid());
create policy "lost pet alerts update own" on public.lost_pet_alerts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lost pet alerts delete own" on public.lost_pet_alerts for delete to authenticated using (user_id = auth.uid());

revoke truncate on public.profiles, public.push_tokens, public.lost_pet_alerts from anon, authenticated;
revoke execute on function public.accept_family_invite(uuid) from anon;
grant execute on function public.accept_family_invite(uuid) to authenticated;

alter function public.current_user_email() set search_path = public, auth, pg_temp;
alter function public.is_household_owner(uuid) set search_path = public, auth, pg_temp;
alter function public.is_household_member(uuid) set search_path = public, auth, pg_temp;
alter function public.can_access_household(uuid) set search_path = public, auth, pg_temp;
alter function public.set_updated_at() set search_path = public, pg_temp;
