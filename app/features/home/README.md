# 메인 페이지

`app/page.tsx`는 라우트 진입점이며 `HomePage.tsx`가 메인 화면을 조립합니다.

- `components/MainHeader.tsx`: 메인 전용 헤더, 날씨·날짜·설치·회원·설정 버튼
- `components/MainMenuGrid.tsx`: 메뉴 카드와 편집 화면
- `components/QuickMenuPanel.tsx`: 빠른메뉴 실행
- `components/MainFooter.tsx`, `MenuEditFooter.tsx`: 일반 하단 링크와 편집 하단 버튼
- `components/*Dialog.tsx`: 기능별 팝업
- `components/Member*.tsx`: 회원 버튼과 메뉴
- `components/ExchangeIndexBar.tsx`: 환율·시장 지표 조회와 표시
- `components/Sortable*.tsx`: 드래그 가능한 메뉴·메모 카드
- `hooks/useHomeState.ts`: 기존 상태와 ref 초기화
- `hooks/useHomeController.ts`: 데이터 조회·저장·이벤트 및 기능 사이 연결
- `data.ts`: 메뉴 정의와 타입
- `HomePage.module.css`: 메인 외곽과 하단 스타일
- `../../components/SiteHeader.module.css`: 공통 헤더 스타일

컴포넌트는 타입이 지정된 controller로 기존 상태와 이벤트를 연결합니다.
승인 조건, 관리자 조건, Supabase 저장 형식, localStorage 키는 분리 전과 같습니다.
권한 변경은 이 리팩터링과 별개입니다.
Tailwind 클래스와 위치 계산에 필요한 동적 style은 각 컴포넌트에 유지합니다.
