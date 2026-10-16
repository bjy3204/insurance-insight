begin;
create table if not exists public.customer_coverage_reports (
 user_id uuid not null references auth.users(id) on delete cascade,
 customer_id uuid not null references public.customer_records(id) on delete cascade,
 encrypted_payload text not null, encryption_key_id text not null default 'v1',
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(user_id,customer_id)
);
alter table public.customer_coverage_reports enable row level security;
revoke all on public.customer_coverage_reports from public,anon,authenticated;
grant select,insert,update,delete on public.customer_coverage_reports to service_role;
commit;
