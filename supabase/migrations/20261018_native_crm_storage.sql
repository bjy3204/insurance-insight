-- 연결 없이 사용하기: 서버 암호화 저장소.
-- Supabase SQL Editor에서 전체 실행. 기존 데이터/암호화 키를 변경하지 않습니다.
-- 회사, 실손, 계좌, 체크리스트, 알릴의무, 상담일지, 계약, 차량, 일정은
-- encrypted_payload 안에 저장하므로 별도 개인정보 열을 추가하지 않습니다.
-- payload_version=1: 기존 고객 API / 2: native CRM API.
-- 버전 2의 고객·계약·차량·일정 모두 이 테이블을 사용합니다.
-- 카드수납 및 전체 주민번호는 native API에서 차단합니다.
begin;

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

create index if not exists customer_records_owner_version_created
  on public.customer_records(user_id, payload_version, created_at, id);

alter table public.customer_records enable row level security;
revoke all on public.customer_records from public, anon, authenticated;
grant select, insert, update, delete on public.customer_records to service_role;

-- 브라우저 직접 접근을 허용하는 정책은 만들지 않습니다.
-- 서버는 로그인·회원 승인 확인 후 user_id와 payload_version을 제한합니다.
-- CUSTOMER_DATA_ENCRYPTION_KEY는 서버 환경변수의 기존 값을 유지해야 합니다.
commit;

-- 적용 확인: 개인정보/암호문을 출력하지 않습니다.
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'customer_records'
order by ordinal_position;
