# 고객관리 시트 자동 생성 시험 설정

## 서버 환경 변수

```dotenv
GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=
GOOGLE_PICKER_API_KEY=
# 생략하면 OAuth 클라이언트 ID의 숫자 접두사로 추출. 반드시 같은 프로젝트 번호.
GOOGLE_CLOUD_PROJECT_NUMBER=
# 랜덤한 긴 값. 없으면 기존 SUPABASE_SERVICE_ROLE_KEY로 임시 상태 쿠키를 암호화.
GOOGLE_SHEETS_STATE_SECRET=
```

기존 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY도 필요하다. 구글 값과 서비스 키는 NEXT_PUBLIC_ 변수로 만들지 않는다.

Google Cloud 프로젝트에서 Drive API를 활성화하고 Google Auth Platform의 웹 애플리케이션 OAuth 클라이언트를 만든다. 승인된 리디렉션 URI에 실제 서비스 주소 + `/api/google/customer-sheet`를 정확히 등록한다. 로컬 시험이면 `http://localhost:3000/api/google/customer-sheet`도 등록한다. OAuth 앱이 테스트 상태면 시험할 구글 계정을 테스트 사용자로 추가한다. 운영 배포 시 동의 화면, 지원 연락처, 개인정보처리방침, 필요한 검증을 마친다.

요청 권한은 `https://www.googleapis.com/auth/drive.file` 한 개다. 전체 드라이브 권한으로 임의 확대하지 않는다.

Google Picker API도 같은 프로젝트에서 활성화한다. APIs & Services → Credentials → Create credentials → API key로 키를 만들고 GOOGLE_PICKER_API_KEY에 설정한다. API 키의 애플리케이션 제한을 Websites로 설정하고 실제 사이트, 로컬 시험 주소, Picker iframe 도메인을 허용한다. 예: `http://localhost:3000/*`, `https://bohuminsight.com/*`, `https://docs.google.com/*`. API 제한은 Google Picker API와 Google Drive API만 허용한다. OAuth 웹 클라이언트의 승인된 JavaScript 원본에도 실제 사이트 원점과 `http://localhost:3000`을 등록한다. 이 API 키는 Picker에 전달되므로 브라우저에 보이는 값이다. OAuth 클라이언트 비밀번호는 전달하지 않는다.

원본 ID: `1CAWo0xJcwlzIA9hL2Zbd_nqdJPQ6KK_kaAN8JzUrVuw`.

## 실제 OAuth 시험이 필요한 부분

- 원본 파일의 읽기/복사 허용을 확인한다. **링크 공개만으로 drive.file의 앱 접근 승인이 충족된다고 보장할 수 없다.** 원본 접근 403/404가 나면 5분간의 암호화 HttpOnly 임시 쿠키를 발급하고 개인공간에서 Picker를 연다. 고정된 원본 ID만 표시하고 서버도 같은 ID만 수락한다. 선택을 마친 후 복사를 재시도한다. 다른 사용자의 임시 쿠키 사용·임의 파일 선택은 거부한다. 키가 없으면 설정 오류를 표시한다. 실제 Google 인증과 원본 선택은 별도 실기 시험이 필요하다.
- 실제 사용자의 Chrome, iPhone Safari, Android Chrome에서 인증 후 원래 보험인사이트 계정의 고객관리 탭으로 복귀하는지 확인한다.
- 생성한 파일이 해당 구글 계정 드라이브의 비공개 파일인지 확인한다. 웹 게시나 공개 공유 API는 호출하지 않는다.
- 비공개 편집 iframe은 브라우저 쿠키 정책에 따라 표시되지 않을 수 있다. 별도 열기 링크는 제공하지 않는다. onLoad만으로 로그인/표시 성공을 판단하지 않는다.
- 기존 customer_url이 있으면 생성 버튼을 숨긴다. 임베드 오른쪽 아래의 '시트 없애기'에서 커스텀 확인 팝업을 거쳐 연결만 해제한다. 구글 파일은 삭제하지 않으며 해제 후 '내 고객관리 시트 만들기' 버튼이 다시 표시된다. 삭제 후 다시 만들면 이전 사본을 재연결하지 않고 최신 원본의 새 사본을 생성한다. 기존 파일은 보존한다. 직접 복사·수동 URL 입력 UI는 제공하지 않는다.
- 동일한 생성 시도 안에서 저장을 재시도하면 Google appProperties의 생성 시도 ID로 사본을 찾아 복구한다. 새로 만들기를 시작하면 새 시도 ID를 발급하여 과거 사본과 구분한다. 다른 구글 계정으로 재시도하거나 동시 요청이 있으면 완전한 전역 중복 방지는 보장되지 않는다.

## 저장 범위

`customer_settings.customer_url`에는 사본 주소를 저장한다. 캘린더 연동은 `supabase/migrations/20261015_sheet_calendar.sql`을 먼저 적용하고 Google Cloud의 **Google Sheets API**를 사용 설정한다. 권한은 기존 `drive.file` 그대로 유지한다. 기존 회원은 캘린더의 ‘일정 연결’로 자기 시트를 한 번 승인한다. 새 사본을 만들지 않는다.

지속적인 읽기를 위해 offline access를 요청한다. access/refresh token은 AES-256-GCM으로 암호화하여 `google_sheet_connections`에 저장한다. 이 테이블은 RLS를 켜고 일반 회원/익명 접근을 차단하며 서버 service_role만 사용한다. 전용 `GOOGLE_SHEETS_STATE_SECRET`을 고정하여 보관한다. 키를 바꾸면 재연결이 필요하다. OAuth 임시 쿠키는 HttpOnly/SameSite=Lax이며 성공·취소 시 삭제한다. 토큰을 URL·localStorage·로그에 남기지 않는다. Picker에 필요한 access token만 본인 인증된 응답에 no-store로 전달한다.

캘린더 API는 현재 회원의 저장된 시트만 읽으며, 생일·계약일·면책/감액개월·차량갱신에 필요한 범위만 조회한다. 고객 행을 DB에 저장하지 않는다. 날짜별 완료 표시는 사용자와 시트에 묶인 HMAC 식별자 및 boolean만 `customer_settings.calendar_completed`에 저장한다. 구글 시트에는 완료 여부를 쓰지 않는다. 연결 해제/주소 변경 시 이전 암호화 인증정보는 트리거로 삭제한다. 구글 파일은 보존한다.

공식 API 범위 근거: https://developers.google.com/workspace/sheets/api/scopes (`drive.file`). 오프라인 인증: https://developers.google.com/identity/protocols/oauth2/web-server#offline.


검증: `node --test lib/auth/google-sheet.test.mjs`, `npx tsc --noEmit`.
