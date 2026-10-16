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
notify pgrst, 'reload schema';
