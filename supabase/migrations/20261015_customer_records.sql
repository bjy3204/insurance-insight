-- Customer-management storage, independent of the spreadsheet tab.
-- Apply with the /api/customers server API and CUSTOMER_DATA_ENCRYPTION_KEY configured.
-- Personal fields belong inside the encrypted payload, never in plaintext columns.
begin;

create table public.customer_records (
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

create table public.customer_contracts (
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

create index customer_records_owner_created on public.customer_records(user_id, created_at, id);
create index customer_contracts_owner_customer on public.customer_contracts(user_id, customer_id, created_at, id);

alter table public.customer_records enable row level security;
alter table public.customer_contracts enable row level security;

-- Browser clients cannot bypass the future server's encryption/validation checks.
revoke all on public.customer_records from public, anon, authenticated;
revoke all on public.customer_contracts from public, anon, authenticated;
grant select, insert, update, delete on public.customer_records to service_role;
grant select, insert, update, delete on public.customer_contracts to service_role;
-- The server must authenticate each request and constrain EVERY query by user_id.

commit;
