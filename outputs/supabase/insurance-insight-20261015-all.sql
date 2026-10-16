-- 보험인사이트 고객관리·캘린더 통합 적용 SQL (2026-10-15)
-- Supabase SQL Editor에서 전체 실행하세요. 기존 데이터는 삭제하지 않습니다.
-- 기존 profiles/customer_settings/auth.users 테이블이 있는 현재 프로젝트용입니다.
-- 고객 상세 데이터는 서버가 AES-256-GCM 암호화한 encrypted_payload로만 저장합니다.
-- SQL은 암호화 키를 생성하지 않습니다. 서버 CUSTOMER_DATA_ENCRYPTION_KEY 설정 필요.
begin;

-- 개인공간 메뉴 순서
alter table public.customer_settings add column if not exists tab_order jsonb;

-- 캘린더 기본 저장소 (이미 존재하면 유지)
create table if not exists public.calendar_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null, content text not null default '', date date not null,
 time text, place text, memo text, icon text not null default '📅',
 color text not null default 'blue', created_at timestamptz not null default now()
);
create table if not exists public.calendar_checklists (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 text text not null, completed boolean not null default false,
 created_at timestamptz not null default now()
);
create index if not exists calendar_events_owner_date on public.calendar_events(user_id,date);
alter table public.calendar_events enable row level security;
alter table public.calendar_checklists enable row level security;
revoke all on public.calendar_events,public.calendar_checklists from anon;
grant select,insert,update,delete on public.calendar_events,public.calendar_checklists to authenticated;
drop policy if exists calendar_events_member_own on public.calendar_events;
create policy calendar_events_member_own on public.calendar_events for all to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (p.status='approved' or p.role='admin')))
 with check (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (p.status='approved' or p.role='admin')));
drop policy if exists calendar_checklists_member_own on public.calendar_checklists;
create policy calendar_checklists_member_own on public.calendar_checklists for all to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (p.status='approved' or p.role='admin')))
 with check (user_id=(select auth.uid()) and exists(select 1 from public.profiles p where p.id=(select auth.uid()) and (p.status='approved' or p.role='admin')));

-- ===== 20261015_customer_records.sql =====
-- Customer-management storage, independent of the spreadsheet tab.
-- Apply with the /api/customers server API and CUSTOMER_DATA_ENCRYPTION_KEY configured.
-- Personal fields belong inside the encrypted payload, never in plaintext columns.

create table if not exists public.customer_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_payload text not null check (length(encrypted_payload) > 0),
  encryption_key_id text not null check (length(encryption_key_id) > 0),
  payload_version integer not null default 1 check (payload_version > 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table if not exists public.customer_contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null,
  encrypted_payload text not null check (length(encrypted_payload) > 0),
  encryption_key_id text not null check (length(encryption_key_id) > 0),
  payload_version integer not null default 1 check (payload_version > 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, customer_id) references public.customer_records(user_id, id) on delete cascade
);

create index if not exists customer_records_owner_created on public.customer_records(user_id, created_at, id);
create index if not exists customer_contracts_owner_customer on public.customer_contracts(user_id, customer_id, created_at, id);

alter table public.customer_records enable row level security;
alter table public.customer_contracts enable row level security;

-- Browser clients cannot bypass the future server's encryption/validation checks.
revoke all on public.customer_records from public, anon, authenticated;
revoke all on public.customer_contracts from public, anon, authenticated;
grant select, insert, update, delete on public.customer_records to service_role;
grant select, insert, update, delete on public.customer_contracts to service_role;
-- The server must authenticate each request and constrain EVERY query by user_id.


-- ===== 20261015_customer_record_order.sql =====
-- Add member-specific drag order without changing encrypted personal data.

alter table public.customer_records add column if not exists sort_order bigint;
create or replace function public.reorder_customer_records(p_user_id uuid, p_ids uuid[])
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user_id is null or p_ids is null or cardinality(p_ids) > 20000
    or array_position(p_ids, null) is not null
    or cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) as ids(id))
  then raise exception 'invalid_order'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  perform 1 from public.customer_records where user_id = p_user_id for update;
  if cardinality(p_ids) <> (select count(*) from public.customer_records where user_id = p_user_id)
    or exists (select 1 from unnest(p_ids) as ids(id) where not exists (
      select 1 from public.customer_records c where c.id = ids.id and c.user_id = p_user_id
    )) then raise exception 'customer_list_changed'; end if;
  update public.customer_records c set sort_order = ids.position - 1
  from unnest(p_ids) with ordinality as ids(id, position)
  where c.id = ids.id and c.user_id = p_user_id;
end;
$$;
revoke all on function public.reorder_customer_records(uuid,uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_customer_records(uuid,uuid[]) to service_role;


-- ===== 20261015_customer_form_options.sql =====
-- Member-specific dropdown preferences only. No customer records are stored.
create table if not exists public.customer_form_options (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('category', 'bank', 'insurer')),
  options text[] not null,
  primary key (user_id, kind)
);
alter table public.customer_form_options enable row level security;
revoke all on public.customer_form_options from anon, authenticated;
grant select on public.customer_form_options to authenticated;
drop policy if exists customer_form_options_read_own on public.customer_form_options;
create policy customer_form_options_read_own on public.customer_form_options
for select to authenticated using (user_id = (select auth.uid()));

-- Atomic updates prevent concurrent changes in different tabs overwriting one another.
create or replace function public.update_customer_form_option(p_kind text, p_value text, p_action text, p_defaults text[])
returns text[] language plpgsql security definer set search_path = '' as $$
declare
  result text[];
  member uuid := auth.uid();
begin
  if member is null then raise exception 'authentication_required'; end if;
  p_value := btrim(p_value);
  if p_kind is null or p_kind not in ('category','bank','insurer')
    or p_action is null or p_action not in ('add','remove')
    or p_value is null or length(p_value) = 0 or length(p_value) > 80
    or p_defaults is null or cardinality(p_defaults) > 100
    or exists (select 1 from unnest(p_defaults) as defaults(value) where value is null or length(value) = 0 or length(value) > 80)
  then raise exception 'invalid_option'; end if;
  insert into public.customer_form_options (user_id, kind, options)
  values (member, p_kind, p_defaults) on conflict (user_id, kind) do nothing;
  select options into result from public.customer_form_options where user_id = member and kind = p_kind for update;
  if p_action = 'remove' then
    result := array_remove(result, p_value);
  elsif not (p_value = any(result)) then
    if cardinality(result) >= 200 then raise exception 'option_limit'; end if;
    result := array_append(result, p_value);
  end if;
  update public.customer_form_options set options = result where user_id = member and kind = p_kind;
  return result;
end;
$$;
revoke all on function public.update_customer_form_option(text,text,text,text[]) from public, anon;
grant execute on function public.update_customer_form_option(text,text,text,text[]) to authenticated;


-- ===== 20261015_sheet_calendar.sql =====
-- No customer names, birth dates, addresses or sheet contents are stored here.
create table if not exists public.google_sheet_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  spreadsheet_id text not null,
  credentials text not null,
  updated_at timestamptz not null default now()
);
alter table public.google_sheet_connections enable row level security;
revoke all on public.google_sheet_connections from anon, authenticated;
grant all on public.google_sheet_connections to service_role;

alter table public.customer_settings
  add column if not exists calendar_completed jsonb not null default '{}'::jsonb;

create or replace function public.set_calendar_event_completed(p_key text, p_completed boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_key is null or p_key !~ '^(event:|sheet:)[a-zA-Z0-9_-]{1,128}$' or p_completed is null then
    raise exception 'invalid_event_key';
  end if;
  insert into public.customer_settings (user_id, calendar_completed)
  values (auth.uid(), case when p_completed then jsonb_build_object(p_key, true) else '{}'::jsonb end)
  on conflict (user_id) do update set calendar_completed =
    case when p_completed then coalesce(public.customer_settings.calendar_completed, '{}'::jsonb) || jsonb_build_object(p_key, true)
      else coalesce(public.customer_settings.calendar_completed, '{}'::jsonb) - p_key end;
end;
$$;
revoke all on function public.set_calendar_event_completed(text, boolean) from public, anon;
grant execute on function public.set_calendar_event_completed(text, boolean) to authenticated;

-- Disconnecting a sheet also drops its saved credentials, without deleting its Drive file.
create or replace function public.clear_changed_sheet_connection()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.customer_url is distinct from new.customer_url then
    delete from public.google_sheet_connections where user_id = new.user_id;
  end if;
  return new;
end;
$$;
revoke all on function public.clear_changed_sheet_connection() from public, anon, authenticated;
drop trigger if exists clear_changed_sheet_connection on public.customer_settings;
create trigger clear_changed_sheet_connection after update of customer_url on public.customer_settings
for each row execute function public.clear_changed_sheet_connection();


-- ===== 20261015_calendar_editor_completion.sql =====
alter table public.customer_settings
  add column if not exists calendar_completed jsonb not null default '{}'::jsonb;

create or replace function public.set_calendar_event_completed(p_key text, p_completed boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_key is null or p_key !~ '^(event:|sheet:)[a-zA-Z0-9_-]{1,128}$' or p_completed is null then
    raise exception 'invalid_event_key';
  end if;
  insert into public.customer_settings (user_id, calendar_completed)
  values (auth.uid(), case when p_completed then jsonb_build_object(p_key, true) else '{}'::jsonb end)
  on conflict (user_id) do update set calendar_completed =
    case when p_completed then coalesce(public.customer_settings.calendar_completed, '{}'::jsonb) || jsonb_build_object(p_key, true)
      else coalesce(public.customer_settings.calendar_completed, '{}'::jsonb) - p_key end;
end;
$$;
revoke all on function public.set_calendar_event_completed(text, boolean) from public, anon;
grant execute on function public.set_calendar_event_completed(text, boolean) to authenticated;


-- Shared event editor category. Existing schedules default to personal.
alter table public.calendar_events add column if not exists category text not null default '개인';


-- ===== 20261001_calendar_reminders.sql =====
-- Run once in the Supabase SQL Editor. Existing calendar rows and columns are preserved.

create table if not exists public.calendar_reminders (
  event_id uuid primary key references public.calendar_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_days smallint not null check (lead_days in (0, 1, 3, 7)),
  notification_date date not null,
  acknowledged_at timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists calendar_reminders_user_date_idx
  on public.calendar_reminders(user_id, notification_date);

alter table public.calendar_reminders enable row level security;
revoke all on public.calendar_reminders from anon;
grant select, insert, update, delete on public.calendar_reminders to authenticated;

drop policy if exists calendar_reminders_owner on public.calendar_reminders;
create policy calendar_reminders_owner on public.calendar_reminders
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.status = 'approved' or p.role = 'admin'))
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and (p.status = 'approved' or p.role = 'admin'))
    and exists (select 1 from public.calendar_events e where e.id = event_id and e.user_id = (select auth.uid()))
  );

-- Derive the date on the server; a client cannot associate a reminder with someone else's event.
create or replace function public.prepare_calendar_reminder()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare event_date date;
begin
  select e.date::date into event_date from public.calendar_events e
    where e.id = new.event_id and e.user_id = new.user_id;
  if event_date is null then raise exception 'Calendar event not available'; end if;
  new.notification_date := event_date - new.lead_days::integer;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.acknowledged_at := null;
  elsif old.lead_days is distinct from new.lead_days or old.notification_date is distinct from new.notification_date then
    new.acknowledged_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists prepare_calendar_reminder on public.calendar_reminders;
create trigger prepare_calendar_reminder before insert or update on public.calendar_reminders
  for each row execute function public.prepare_calendar_reminder();

-- Editing the event date in either existing calendar keeps the reminder in sync.
create or replace function public.sync_calendar_reminder_date()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.date is distinct from new.date then
    delete from public.calendar_reminders where event_id = new.id
      and (notification_date < (now() at time zone 'Asia/Seoul')::date or acknowledged_at is not null);
    update public.calendar_reminders set lead_days = lead_days where event_id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_calendar_reminder_date on public.calendar_events;
create trigger sync_calendar_reminder_date after update of date on public.calendar_events
  for each row execute function public.sync_calendar_reminder_date();


notify pgrst, 'reload schema';
-- Member-specific last viewed customer, shared across desktop and mobile.

create table if not exists public.customer_view_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 customer_id uuid not null,
 updated_at timestamptz not null default now(),
 foreign key (user_id,customer_id) references public.customer_records(user_id,id) on delete cascade
);
alter table public.customer_view_preferences enable row level security;
revoke all on public.customer_view_preferences from public,anon,authenticated;
grant select,insert,update,delete on public.customer_view_preferences to service_role;

notify pgrst, 'reload schema';
commit;
