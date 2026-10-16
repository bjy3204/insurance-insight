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
