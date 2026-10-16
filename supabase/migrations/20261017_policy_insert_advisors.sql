begin;

create table if not exists public.policy_insert_advisors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 30),
  company text not null default '' check (char_length(company) <= 40),
  phone text not null default '' check (char_length(phone) <= 30),
  fax text not null default '' check (char_length(fax) <= 30)
);

alter table public.policy_insert_advisors enable row level security;
revoke all on public.policy_insert_advisors from public, anon, authenticated;
grant select, insert, update on public.policy_insert_advisors to authenticated;
grant all on public.policy_insert_advisors to service_role;

drop policy if exists "Read own advisor information" on public.policy_insert_advisors;
create policy "Read own advisor information" on public.policy_insert_advisors
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own advisor information" on public.policy_insert_advisors;
create policy "Insert own advisor information" on public.policy_insert_advisors
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own advisor information" on public.policy_insert_advisors;
create policy "Update own advisor information" on public.policy_insert_advisors
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

commit;
