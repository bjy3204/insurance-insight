-- Member-specific last viewed customer, shared across desktop and mobile.
begin;
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
