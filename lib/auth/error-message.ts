export function authErrorMessage(error: unknown, fallback = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."): string {
  const value = error as { message?: unknown; code?: unknown } | null;
  const message = typeof value?.message === "string" ? value.message : "";
  const code = typeof value?.code === "string" ? value.code : "";
  const text = `${code} ${message}`.toLowerCase();
  if (/user_already_exists|email_exists|already registered|already been registered/.test(text)) return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (/invalid_credentials|invalid login credentials/.test(text)) return "이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.";
  if (/email_not_confirmed|email not confirmed/.test(text)) return "이메일 인증을 완료한 뒤 로그인해 주세요.";
  if (/rate_limit|too many requests|security purposes|over_request/.test(text)) return "요청이 많아 잠시 제한되었습니다. 잠시 후 다시 시도해 주세요.";
  if (/weak_password|password.*(least|short|weak)/.test(text)) return "비밀번호가 보안 조건에 맞지 않습니다. 6자 이상으로 다시 입력해 주세요.";
  if (/email_address_invalid|invalid email|email.*invalid/.test(text)) return "이메일 주소를 올바르게 입력해 주세요.";
  if (/session.*(missing|expired)|jwt.*expired|refresh_token/.test(text)) return "로그인 인증이 만료되었습니다. 다시 로그인해 주세요.";
  if (/complete_email_signup|pgrst202/.test(text)) return "회원가입 처리 설정에 문제가 있습니다. 관리자에게 문의해 주세요.";
  if (/failed to fetch|network|fetch failed/.test(text)) return "인터넷 연결을 확인한 뒤 다시 시도해 주세요.";
  // Only known Korean application messages may pass through; provider errors stay private.
  if (/[가-힣]/.test(message) && !/[a-z]{3}/i.test(message)) return message;
  return fallback;
}
