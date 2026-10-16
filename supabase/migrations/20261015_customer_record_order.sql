-- Add member-specific drag order without changing encrypted personal data.
begin;
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
commit;
