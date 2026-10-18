-- Supabase SQL Editor에서 실행
alter table public.notices_db add column if not exists popup_repeat_daily boolean not null default false;
notify pgrst, 'reload schema';
