# TASK — Google·GitHub·이메일 인증과 사용자별 클라우드 저장

기존 칸반·Playwright 도입 완료 이력은 [TASKS](TASKS.md)와 WORKFLOW.md에 보존한다. 이번 단계는 기존 Supabase Auth 재사용, 전용 칸반 저장소, test-first 구현·검증이다.

## 0. 사용자 직접 확인 — 남은 운영 확인의 맨 앞

- [x] GitHub 앱 설정에 KanbanBoard 저장소 접근을 추가했다. 설치 접근 목록에서 TIL·todo·KanbanBoard를 확인하고 업로드를 재개했다.

- [x] 기존 Supabase 재사용·사용자별 클라우드 저장·기존 todos 보존 선택을 확인했다.
- [x] 사용자가 Google·GitHub·이메일 구성을 완료했다고 보고했다. 공개 설정 API로 세 Provider 활성화·가입 허용·이메일 확인 필수를 확인했다.
- [x] 칸반 전용 테이블 존재와 비로그인 조회 거부를 읽기 전용으로 확인했다. 에이전트가 기존 todo 데이터나 원격 스키마를 변경하지 않았다.
- [ ] 실제 Google·GitHub 계정 로그인·취소·복귀와 이메일 가입 → 인증 메일 수신 → 링크 확인 → 로그인을 사용자 브라우저에서 확인한다.
- [ ] 실제 운영 두 계정에서 생성·저장·새로고침·다른 기기 복원과 A/B 데이터 격리를 확인한다. SQL/RPC 적용 상태와 복귀 URL·SMTP는 [AUTH_SETUP](AUTH_SETUP.md)를 대조한다.

위 실계정 항목은 공개 API나 모의 E2E로 완료했다고 표시하지 않는다. 비밀번호·OAuth secret·SMTP 암호는 채팅으로 요청하지 않는다.

## 1. 에이전트 구현

- [x] 인증 화면 계약 테스트를 먼저 작성·실행하고 auth-panel 부재 assertion Red를 기록했다.
- [x] 공개 연결 config.js, auth.js·cloud.js·session.js와 로그인·가입·인증 메일 재발송·OAuth·로그아웃 UI를 구현했다.
- [x] 기존 todos와 분리된 kanban_boards·검증 함수·버전 트리거·RLS·원자적 저장 RPC SQL을 작성했다.
- [x] 서버 확정 후 렌더링·저장 중 잠금·실패/충돌 후 재조회·세대 검사·로그아웃/전환 초기화를 구현했다.
- [x] 이전 브라우저 보드는 명시적 확인 후 빈 서버 보드로만 가져오고 원본을 보존했다.
- [x] 실제 Supabase JS 2.119.0 SDK와 별도 테스트 Auth/PostgREST 응답을 사용하는 E2E 경계를 구성했다. 제품 코드에 테스트 인증 우회는 없다.
- [x] 로컬 PostgreSQL(PGlite)에서 SQL 재실행·todo 데이터/함수 보존·RLS·버전 충돌·서버 입력 검증을 실행했다.

## 2. Red → Green → Refactor

- [x] 인증 화면 부재 Red → 가입·OAuth·로그인 화면과 세션 코드 구현으로 Green.
- [x] cloud 오류 객체 계약 Red → Error로 변환하고 코드 보존 → 단위 테스트 Green.
- [x] Materialize 오류가 숨겨진 보드 안에 있어 보이지 않는 UF-11 Red → 전역 오류 영역으로 이동 → desktop/mobile Green.
- [x] 이전 보드 가져오기 중 추가 버튼이 살아 있는 UF-17 Red → 편집·재조회 차단 → desktop/mobile Green.
- [x] Green 이후 이메일 검증·서버 오류 변환을 공통 함수로 정리했다. 늦은 응답 검증은 열린 모달 밖 클릭 대신 다른 탭의 실제 SDK 세션 종료 이벤트로 구성했다.
- [x] 테스트 라우터의 URL 이름 충돌, 숨겨진 요소 locator, Jest VM/프로세스 환경 오류는 제품 결함과 구분해 수정했다. 실패 trace·보고서·로그를 tdd-evidence/auth/red/에 보존했다.

## 3. 전체 검증과 인계

- [x] 전체 `npm run test:all`에서 Jest와 두 Chromium 프로젝트의 인증·기존 보드·클라우드 E2E를 통과한다.
- [x] 실제 CDN·공개 Provider 설정 smoke 및 로그인 화면 캡처를 확인한다.
- [x] UF-01~UF-17 추적표·설계 문서·실행 방법·실제 결과·운영 미검증 범위를 갱신한다.

개발 자동 테스트 완료와 운영 실계정 인증 완료를 구분한다. 물리 기기·Safari는 미검증이다. 사용자 추가 요청에 따라 GitHub Pages 게시와 저장소 커밋을 현재 범위에 포함한다. 현재 최신 실행 결과는 완료 후 아래에 기록한다.


## 최종 자동 검증 결과

- `npm run test:all`: Jest 6개 스위트·84개 테스트, Playwright 92개(desktop 46·mobile 46) 통과. 실패·skip 0개.
- Jest SQL 통합 테스트는 실제 PostgreSQL(PGlite)에서 별도의 6개 SQL/RLS 시나리오를 실행한다. 운영 데이터는 쓰지 않았다.
- 실제 Supabase 공개 설정은 Google·GitHub·Email 활성화, 가입 허용, Confirm email 필수 상태를 반환했다. kanban_boards 익명 조회는 401/42501로 거부됐다.
- 전체 로그: tdd-evidence/auth/final-all.log. Red 로그·trace·화면·보고서: tdd-evidence/auth/red/. Green 관련 E2E 10개와 Refactor 후 전체 통과를 기록했다. 최종 보고서는 playwright-report/index.html이다.
- 실제 Provider 설정·SDK·로그인 화면 smoke 캡처를 desktop/mobile에서 확인했다. 실제 외부 계정 동의·메일 수신·운영 인증 토큰 CRUD는 위 사용자 확인 항목에 남겼다.


## 4. GitHub Pages 배포 — 현재 작업

- [x] 배포 전 전체 Jest 84개·E2E 92개 재검증과 정적 파일·상대 경로 확인.
- [x] Markdown 전체 최신화, README·DEPLOY 작성, .nojekyll 준비.
- [ ] https://github.com/YangSeungYeol/KanbanBoard의 main에 소스·테스트·SQL·문서를 커밋하고 커밋 메시지에 https://yangseungyeol.github.io/KanbanBoard/ 포함.
- [ ] Pages의 Deploy from a branch / main / root 설정 확인. 연결 도구에 설정 기능이 없으면 업로드 후 사용자에게 관리자 화면의 마지막 조작만 요청.
- [ ] Supabase Redirect URLs에 https://yangseungyeol.github.io/KanbanBoard/ 등록 및 실제 계정 복귀 확인. 관리자 설정 도구가 없어 등록 여부는 사용자 확인 필요.
- [ ] GitHub 배포 실행 성공과 공개 URL·정적 파일·로그인 화면을 실제 브라우저로 확인.
- [ ] 최종 게시 결과를 문서에 반영하고 후속 문서 커밋에도 Pages 주소 포함.
