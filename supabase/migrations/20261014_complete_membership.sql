-- Authentication creation must not create a site membership.
-- Preserve the existing trigger but make its function stop creating empty profiles.
begin;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  return new;
end;
$$;

-- Save the required fields atomically for the authenticated user only.
-- Existing incomplete pending profiles can finish signup without deleting their Auth account.
create or replace function public.complete_email_signup(p_nickname text, p_instagram text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  member_id uuid := auth.uid();
  member_email text;
begin
  if member_id is null then raise exception '로그인 인증이 필요합니다.'; end if;
  if nullif(btrim(p_nickname), '') is null or nullif(btrim(p_instagram), '') is null then
    raise exception '닉네임과 인스타그램 아이디를 입력해 주세요.';
  end if;
  select email into member_email from auth.users
    where id = member_id and email_confirmed_at is not null;
  if member_email is null then raise exception '이메일 인증 후 회원가입을 완료해 주세요.'; end if;
  insert into public.profiles (id, email, nickname, instagram_id, status, role, kakao_connected)
  values (member_id, member_email, btrim(p_nickname), btrim(p_instagram), 'pending', 'user',
    exists (select 1 from auth.identities where user_id = member_id and provider = 'kakao'))
  on conflict (id) do update set
    email = excluded.email, nickname = excluded.nickname, instagram_id = excluded.instagram_id,
    kakao_connected = excluded.kakao_connected
  where public.profiles.status = 'pending'
    and coalesce(public.profiles.role, 'user') = 'user'
    and (nullif(btrim(public.profiles.nickname), '') is null
      or nullif(btrim(public.profiles.instagram_id), '') is null);
  if not found then raise exception '이미 회원가입한 계정입니다. 로그인해 주세요.'; end if;
end;
$$;
revoke all on function public.complete_email_signup(text, text) from public, anon;
grant execute on function public.complete_email_signup(text, text) to authenticated;
commit;
