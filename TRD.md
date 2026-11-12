# TRD — 칸반보드 기술 설계

## 구성과 실행

`index.html`은 의미 있는 컬럼·폼·모달 구조와 파일 연결을, `style.css`는 반응형 및 드래그 스타일을, `script.js`는 상태·저장·렌더링·이벤트를 담당한다. 앱 빌드는 사용하지 않는다. Node.js와 npm은 Jest 및 Playwright Test 개발 환경에 필요하다.

- Materialize CSS: `https://cdn.jsdelivr.net/npm/@materializecss/materialize@2.2.2/dist/css/materialize.min.css`
- Materialize JS: `https://cdn.jsdelivr.net/npm/@materializecss/materialize@2.2.2/dist/js/materialize.min.js`
- 앱 CSS는 라이브러리 CSS 뒤에, 앱 JS는 라이브러리 JS 뒤에 로드한다.
- Materialize 2.2.2 모달 스타일과 네이티브 dialog의 showModal·close를 카드 관리에 사용한다. 해당 버전의 Modal.open·close는 구현되어 있지 않아 호출하지 않는다. 의존성 로딩 실패 시 초기화를 중단하고 오류를 안내한다. 저장 내용을 덮어쓰지 않는다.
- 기본 실행은 프로젝트 디렉터리에서 `python3 -m http.server 8000 --bind 127.0.0.1` 실행 후 `http://localhost:8000/`에 접속한다. 직접 파일 열기는 저장 호환성을 보장하는 검증 경로로 삼지 않는다.

## 상태와 내부 인터페이스

현재 데이터 구조·키·검증은 [DATABASE_DESIGN](DATABASE_DESIGN.md)을 단일 기준으로 삼는다. 메모리 상태가 렌더링의 기준이며 DOM을 저장 원본으로 사용하지 않는다.

| 내부 동작 | 입력 | 결과 |
|---|---|---|
| 카드 추가 | 제목, 설명 | 고유 ID를 가진 카드를 `todo` 마지막에 추가 |
| 카드 수정 | 카드 ID, 제목, 설명 | 내용만 갱신하고 컬럼·순서는 유지 |
| 카드 삭제 | 카드 ID | 해당 카드 제거 |
| 카드 이동 | 카드 ID, 대상 상태, 제거 후 배열 기준 삽입 인덱스 | 원본에서 제거 후 대상 위치에 삽입 |
| 저장 읽기 | Storage 의존성 | 검증된 보드와 복원 안내 상태 |
| 저장 쓰기 | 보드, Storage 의존성 | 성공 여부와 오류 안내 상태 |

외부 공개 API는 없다. 순수 상태 연산과 DOM 바인딩을 논리적으로 분리한다. 테스트에서는 CommonJS 조건부 내보내기를 사용하고 브라우저에서는 일반 스크립트로 실행한다. 잘못된 ID·상태·인덱스는 변경 없이 거부한다.

## 데이터 흐름과 렌더링

1. DOM·SDK 준비 → 인증 세션 확인 → 사용자별 서버 조회 → 보드 검증 → createApp 초기 상태 주입 → 렌더링·이벤트 연결 순으로 초기화한다.
2. 입력 검증 → 상태 연산 → 전용 RPC 저장 대기 → 서버 응답 검증 → 화면·개수·빈 상태·안내 갱신 순으로 처리한다. 실패 시 확정 화면을 유지하고 재조회를 요구한다.
3. ID는 `crypto.randomUUID()`로 생성한다. 제목은 trim 후 필수 검사하며 설명은 입력 줄바꿈을 보존한다.
4. `textContent`와 폼 `value`로 사용자 입력을 표시한다. 사용자 문자열을 `innerHTML`에 삽입하지 않는다.
5. 보드 이벤트는 위임하고, 렌더링 후 카드·모달 관련 포커스를 복원한다. 모달 취소는 상태를 변경하지 않는다.

## 드래그와 접근성

- 핸들의 `pointerdown`에서 시작 위치·카드 ID를 기록하고 8px 이동 후 드래그를 시작한다. 핸들에만 `touch-action: none`을 적용한다.
- pointer capture로 이동을 추적한다. 떠다니는 복제본은 포인터 히트 테스트에서 제외한다. 컬럼 경계와 카드 중간점을 기준으로 삽입 위치를 계산한다.
- 드래그 중에는 원본 상태를 변경하지 않는다. 유효한 보드 내 `pointerup`에서만 이동을 확정·저장한다.
- Escape·`pointercancel`·보드 밖 드롭에서 복제본·표시·capture·자동 스크롤을 정리하고 원래 상태를 유지한다.
- 화면 상하 48px 영역에서는 `requestAnimationFrame`으로 자동 스크롤한다. 종료·취소 시 루프를 중지하고 스크롤 후 위치를 재계산한다.
- 상태 메뉴는 네이티브 `select`를 사용한다. 현재 상태 재선택은 순서를 바꾸지 않으며 다른 상태 선택은 대상 끝으로 이동한다.
- 이동 후 포커스를 해당 카드의 조작부로 복원하고 `aria-live="polite"`로 결과를 알린다.

## 인증·클라우드 계층

- auth.js는 Google/GitHub OAuth·이메일 가입/로그인·확인 메일 재발송·현재 브라우저 로그아웃을 처리한다. PKCE·지속 세션·자동 갱신을 사용하며 세션 키는 kanban-auth:v1이다.
- session.js는 세션 확인·사용자 변경·보드 생명주기를 관리한다. onAuthStateChange 안의 후속 API는 microtask로 처리한다. 로그아웃·전환 시 보드·모달·드래그를 정리하고 이전 세대 응답을 무시한다.
- cloud.js는 본인 kanban_boards 행을 조회하고 save_kanban_board RPC에 보드·기대 버전을 전달한다. 15초 제한·중복 쓰기 방지·소유자 응답 확인·실패 후 재조회 조건을 둔다.
- createApp에는 initialBoard·save·onBusy·onError를 주입한다. 서버 확정 후 화면에 반영한다. 기존 localStorage 코드는 이전 데이터 가져오기와 단위 테스트 호환용이며 운영 저장 실패의 fallback이 아니다.
- 비밀번호는 인증 API에만 전달하고 요청 후 입력을 비운다. 공개 config.js에 URL·Publishable key만 둔다. 전용 SQL·RLS·충돌 계약은 DATABASE_DESIGN.md를 따른다.

## 테스트·환경

- Node.js >=22, Jest·jest-environment-jsdom 30.2.0, Playwright Test 1.65.0, Materialize 2.2.2, Supabase JS 2.119.0, PGlite 0.5.16을 정확한 버전·lockfile로 관리한다.
- Jest 84개는 기존 보드 모델/DOM과 인증·클라우드 계약, 별도 Node 프로세스의 실제 PostgreSQL SQL/RLS 6개 시나리오를 포함한다. 설치·샌드박스 오류는 assertion Red와 구분한다.
- Playwright 92개는 desktop-chromium 1280×1000과 mobile-chromium 375×812 각 46개다. worker 1·retry 0·forbidOnly, timeout 30초·expect 5초를 사용한다.
- testDir은 e2e, testMatch는 **/*.spec.js다. 테스트 서버는 127.0.0.1:8014에서 자동 시작·종료하며 기존 서버를 재사용하지 않는다.
- 일반 fixture는 실제 Materialize·Supabase SDK 파일을 읽고 외부 Auth/PostgREST 응답만 대체한다. 테스트 계정·JWT는 e2e에만 있으며 제품 코드에 테스트 인증 우회가 없다.
- 별도 smoke는 실제 CDN과 공개 Provider 설정을 확인한다. 실제 계정 동의·메일 수신·운영 인증 토큰 CRUD를 검증했다고 주장하지 않는다.
- 마우스·CDP touch 입력과 expect 자동 대기/poll을 사용한다. 각 test는 독립 BrowserContext로 실행한다. 실패 screenshot·trace·HTML 보고서와 Red/Green 기록을 보존한다.
- npm 래퍼가 프로젝트 로컬 Chromium을 사용하고, Ubuntu 22.04 보조 설치기가 공식 .deb를 사용자 범위 playwright/.cache에 준비한다. /tmp Python 설치에 의존하지 않는다.

| 명령 | 동작 |
|---|---|
| npm test -- --runInBand | 전체 Jest |
| npm run test:e2e:install | 프로젝트 Chromium 설치 |
| npm run test:e2e:runtime | Ubuntu 22.04 사용자 범위 실행 라이브러리·폰트 준비 |
| npm run test:e2e | 두 Chromium 프로젝트 E2E |
| npm run test:e2e:headed | GUI 브라우저 E2E |
| npm run test:e2e:report | HTML 보고서 열기 |
| npm run test:all | Jest → E2E 통합 실행 |

## 배포 구조

앱은 빌드가 필요 없는 정적 파일이다. main 루트에 index.html·style.css·script.js·auth.js·cloud.js·session.js·config.js와 .nojekyll을 둔다. HTML의 앱 자산 경로는 상대 경로이며 CDN과 Supabase는 HTTPS를 사용한다. OAuth·이메일 복귀 주소는 현재 페이지의 경로를 유지하고 query/hash를 제거하여 /KanbanBoard/에서 동작한다.

테스트·SQL·문서·패키지 구성은 저장소에 보존한다. node_modules·브라우저 바이너리·보고서·test-results·tdd-evidence·OS runtime 캐시는 Git 제외한다. 기존 교육 저장소의 다른 폴더를 커밋하지 않는다.

- 저장소: [https://github.com/YangSeungYeol/KanbanBoard](https://github.com/YangSeungYeol/KanbanBoard)
- 운영 주소: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/)
- Pages 설정·배포 결과: [DEPLOY](DEPLOY.md)
- 운영 인증 설정: [AUTH_SETUP](AUTH_SETUP.md)


## 게시 확인 — 2026-11-12

운영 주소: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/). [앱 소스 6185f0a](https://github.com/YangSeungYeol/KanbanBoard/commit/6185f0a03784d7814cea16d10ea00ad84eef1311)의 [Pages 배포](https://github.com/YangSeungYeol/KanbanBoard/actions/runs/43162571976) 성공과 공개 데스크톱·모바일 로그인 화면·런타임 7개 원본 일치를 확인했다. 배포 전 Jest 84개·E2E 92개가 통과했다. Pages 설정과 Supabase 복귀 주소 등록은 사용자 완료 확인을 받았다. 실제 계정 동의·메일 수신·운영 데이터 CRUD는 별도 검증 범위다. 최신 배포 절차·증거는 [DEPLOY](DEPLOY.md)를 따른다.
