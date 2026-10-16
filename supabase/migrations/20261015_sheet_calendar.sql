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
