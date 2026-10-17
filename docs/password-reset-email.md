# 비밀번호 재설정 메일 설정

Supabase Dashboard → 프로젝트 → Authentication → Emails → Templates → Reset Password

Subject (제목): 보험인사이트 비밀번호 재설정

Body (본문): supabase/templates/recovery.html 전체 내용을 붙여넣고 저장

발신자 표시명까지 변경하려면 Authentication → Emails → SMTP 설정의 Sender name을 보험인사이트로 설정 (커스텀 SMTP 사용 시)

Authentication → URL Configuration의 Redirect URLs에 아래 주소도 등록
- http://localhost:3000/reset-password
- https://bohuminsight.com/reset-password
- https://www.bohuminsight.com/reset-password

프로젝트 코드에 HTML 파일을 저장하는 것만으로 호스팅된 Supabase 메일 템플릿이 바뀌지는 않습니다
2026-10-17: insurance-insight 프로젝트 대시보드에서 한국어 제목·본문을 실제 저장했고, 새로고침 후 유지되는 것을 확인했습니다
발신자 표시명은 기본 Supabase Auth이며 커스텀 SMTP는 변경하지 않았습니다

공식 안내: https://supabase.com/docs/guides/auth/auth-email-templates
