# 국민연금표 엑셀 교체

교체할 파일: `app/pension-calculator/data/예상연금월액표.xlsx`

1. 국민연금공단 공식 XLSX 파일을 `예상연금월액표.xlsx`라는 이름으로 저장한다.
2. 위 경로의 기존 엑셀 파일을 같은 이름으로 덮어쓴다.
3. 로컬에서는 서버를 종료하고 `npm run dev`로 다시 실행한다. 배포 사이트에는 재배포한다.

`predev`와 `prebuild`가 엑셀 시트 제목에서 기준 연월을 읽고 노령·장애·유족 표를 검증해 `nps-tables.json`을 만든다.
이 JSON은 화면용 변환 결과이므로 직접 삭제하거나 수정할 필요 없다. 변환 성공 시 기존 데이터가 덮어써진다.
변환 실패 시 기존 JSON을 유지하며 실행/빌드는 오류로 중단된다. 형식 변경 시 파서 수정이 필요하다.

메인과 연금계산기는 공통 팝업 및 같은 JSON을 사용한다. 브라우저에서 엑셀을 파싱하거나 서버 자료를 조회하지 않는다.

수동 변환만 실행하려면:

```powershell
node scripts/import-nps-tables.mjs
```

다른 파일을 지정하려면:

```powershell
node scripts/import-nps-tables.mjs "C:\자료\예상연금월액표.xlsx" 2026-07
```

과거 `npsTableData.ts`와 자동 갱신용 API·Cron·조회 훅은 제거했다. Redis에 과거 기록이 남아 있더라도 화면에서 조회하지 않는다.
