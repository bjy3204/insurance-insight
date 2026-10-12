-- After applying this SQL, select public.require_email_signup_first in
-- Authentication > Hooks > Before User Created. Applying SQL alone does not enable it.
create or replace function public.require_email_signup_first(event jsonb)
returns jsonb language plpgsql as $$
begin
  if event->'user'->'app_metadata'->>'provider' = 'kakao' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403, 'message', 'email_signup_required: 회원가입을 진행해 주세요.'
    ));
  end if;
  return '{}'::jsonb;
end;
$$;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.require_email_signup_first(jsonb) to supabase_auth_admin;
revoke execute on function public.require_email_signup_first(jsonb) from anon, authenticated, public;
