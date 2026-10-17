-- Run once in the Supabase SQL editor. OAuth secrets are encrypted by the server.
create table if not exists public.crm_storage_connections (
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null check (provider in ('notion','sheets')),
 encrypted_connection text not null,
 updated_at timestamptz not null default now(),
 primary key (user_id, provider)
);
alter table public.crm_storage_connections enable row level security;
revoke all on public.crm_storage_connections from anon, authenticated;
grant select, insert, update, delete on public.crm_storage_connections to service_role;
comment on table public.crm_storage_connections is 'Server-only encrypted member OAuth connections; no customer or card data';
