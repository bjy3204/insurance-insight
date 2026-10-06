-- Run once in the Supabase SQL Editor. Existing calendar rows and columns are preserved.
begin;

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
commit;
