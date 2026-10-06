# Instagram 토큰 자동 갱신

## 배포 설정

Vercel 프로젝트 → Settings → Environment Variables에서 Production에 다음을 설정하고 재배포합니다.

- `INSTAGRAM_ACCESS_TOKEN`: 현재 정상 작동하는 Instagram Login 장기 토큰.
- `CRON_SECRET`: 비밀번호 생성기로 만든 임의의 긴 문자열(최소 16자). Instagram 토큰과 다른 값을 사용합니다.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: 기존 방문자 집계에 사용하는 Redis 설정. 기존 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 이름도 지원합니다.

Supabase SQL 추가는 필요 없습니다. Redis의 `instagram:token:` 키에 갱신 토큰을 보관하므로 Redis 접근 키는 서버 환경변수로만 관리합니다.

## 동작

- Vercel Cron이 매일 UTC 01:00(한국 오전 10시)에 확인합니다. Hobby 플랜에서는 실행 시간이 해당 시간대 안에서 달라질 수 있습니다.
- 저장된 갱신 기록이 없으면 첫 실행에서 갱신하고, 이후에는 30일마다 갱신합니다.
- 발급 후 24시간이 지나지 않은 토큰의 첫 갱신은 실패할 수 있습니다. 다음 날 다시 시도합니다.
- 갱신 실패 시 저장된 토큰을 덮어쓰지 않고 다음 날 재시도합니다.
- 조회 API는 Redis에 저장된 최신 토큰을 사용합니다. 저장 기록이 없을 때만 환경변수 토큰을 사용합니다.
- 환경변수의 토큰을 수동으로 교체하면 새 저장 키를 사용합니다. 교체 뒤에도 환경변수의 최초 토큰을 삭제하지 마세요.
- Redis에는 만료 TTL을 설정하지 않습니다. 저장소를 초기화하거나 토큰 키를 삭제하면 과거 환경변수 토큰으로 돌아갈 수 있으므로 삭제하지 마세요.
- 만료되거나 권한이 철회된 토큰은 자동 복구할 수 없습니다. 새 토큰을 환경변수에 넣고 재배포해야 합니다.

## 배포 후 확인

Vercel → Settings → Cron Jobs에서 `/api/cron/instagram-token` 등록 여부를 확인합니다. Run으로 실행하고 로그에서 응답 상태를 확인할 수 있습니다.

- `refreshed`: 갱신 및 저장 완료.
- `not_due`: 아직 갱신 시기가 아닙니다.
- `busy`: 다른 갱신 요청이 실행 중입니다.
- HTTP 503: Redis 환경변수, 토큰 유효성 및 발급 후 24시간 경과 여부를 확인합니다.
- HTTP 401: `CRON_SECRET` 설정 및 재배포 여부를 확인합니다.

로그 또는 채팅에 실제 토큰을 붙여 넣지 마세요.

Vercel 공식 안내: https://vercel.com/docs/cron-jobs/manage-cron-jobs
Meta 갱신 API: https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/
