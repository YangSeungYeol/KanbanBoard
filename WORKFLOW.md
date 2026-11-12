# 작업 기록

> 현재 운영 주소: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/) · [저장소](https://github.com/YangSeungYeol/KanbanBoard). 아래 번호별 기록은 당시 수행 결과를 보존하며 최신 배포 진행은 마지막 항목을 따른다.

## 001

### 프롬프트 원문

```text
HTML, css, js만으로 구성되는 칸반보드를 만들려고 해. 보드에는 To-Do, In-Progress, Done의 세가지 컬럼이 있어. 카드를 드래그해서 각 컬럼간 이동이 가능하게 해야 해. HTML과 css, js는 각각 다른파일로 저장해줘. UI에는 머티리얼을 적용해주고 반응형으로 모바일에서도 문제없이 보이게 해줘 테스트는 jest로 구성하고 테스트가 완료되어야 작업이 끝나는거야.
```

### 결과 요약

- 계획 모드에서 구현 계획을 확정했다. 사용자가 카드 추가·수정·삭제, 브라우저 저장, 외부 머티리얼 라이브러리를 선택했다.
- 계획 모드에서는 파일을 변경하지 않았다. 구현·테스트는 진행하지 않았으며 현재 쓰기 가능한 차례에 소급 기록했다.

## 002

### 프롬프트 원문

```text
현재 플랜을 PLAN.md에 저장하고, PRD, TRD, User Flow, DataBase Design, Design System, TASKS를 모두 md로 작성해줘
```

### 결과 요약

- 계획 모드에서 설계 문서 7개 작성 계획을 확정했다. 당시 파일은 변경하지 않았으며 현재 소급 기록했다.

## 003

### 프롬프트 원문

```text
Implement the plan.
```

### 결과 요약

- `PLAN.md`, `PRD.md`, `TRD.md`, `USER_FLOW.md`, `DATABASE_DESIGN.md`, `DESIGN_SYSTEM.md`, `TASKS.md`를 한국어로 작성했다.
- Materialize 2.2.2, 카드 관리·드래그·접근성·반응형, localStorage 데이터 계약, Jest 및 실제 브라우저 완료 기준을 문서 간 일치시켰다.
- 문서 7개의 존재·제목·코드 블록과 상대 링크 22개를 검사해 통과했다. 구현 작업 체크박스가 모두 미완료임을 확인했다.
- 문서 작성 작업을 완료했다. 앱 코드 구현·패키지 설치·Jest 실행·브라우저 검증·배포는 수행하지 않았으며 앱 구현은 미완료다.

## 004

### 프롬프트 원문

```text
task.md 대로 구현하고 JEST실행도 진행해
```

### 결과 요약

- `index.html`, `style.css`, `script.js`에 칸반보드를 구현했다. 카드 추가·수정·삭제, 세 컬럼 간 이동·같은 컬럼 재정렬, 마우스·터치 핸들, 이동 취소, 자동 스크롤, 키보드 상태 메뉴, 접근성 모달·알림을 포함했다.
- localStorage에 카드·컬럼·순서를 저장·복원하며 손상·읽기 차단·쓰기 실패를 안내한다. 사용자 입력은 텍스트로 표시한다.
- package.json·package-lock.json·.gitignore와 Jest 상태·DOM 테스트, 재실행 가능한 tests/browser.py를 추가했다. Node.js v22.23.4·npm 10.9.9에서 Jest·jest-environment-jsdom 30.2.0을 설치했다.
- `npm test -- --runInBand`: 2개 스위트, 59개 테스트 모두 통과했다. `node --check script.js`도 통과했다.
- 실제 Materialize 2.2.2 CDN과 Chromium headless shell에서 브라우저 검증 13개 항목을 통과했다. 320·375·768·1280px 화면, CRUD·재정렬·취소·저장 복원·오류·키보드 포커스·CDN 실패와 모바일 CDP 터치 이동·자동 스크롤·취소를 확인했다.
- 브라우저 테스트는 `PYTHONPATH=/tmp/mini2-browser-deps LD_LIBRARY_PATH=/tmp/mini2-browser-libs/extracted/usr/lib/x86_64-linux-gnu FONTCONFIG_FILE=/tmp/mini21-browser-fonts.conf KANBAN_BROWSER=/tmp/mini2-playwright-browsers/chromium_headless_shell-1254/chrome-headless-shell-linux64/chrome-headless-shell timeout 55s python3 -u tests/browser.py`로 실행했다. 테스트 서버는 127.0.0.1:8014를 사용했다.
- Jest·CDN·서버·Chromium의 샌드박스 네트워크·소켓 제한은 승인된 실행으로 해결했다. Materialize 2.2.2 Modal.open·close가 빈 구현인 점을 반영해 native dialog를 사용했고 숨은 textarea 측정 요소의 모바일 가로 넘침을 수정했다.
- PLAN.md·TRD.md·TASKS.md에 실제 구현과 검증 결과·실행 방법을 반영했다. 물리 모바일 기기·Safari는 미검증이며 모바일 확인은 Chromium 에뮬레이션이다. 커밋·푸시·배포는 수행하지 않았다.

## 005

### 프롬프트 원문

```text
기존 todo랑 차이가뭐야..?
```

### 결과 요약

- 기존 todo와 day14 소스를 비교했다. 기존은 높음·중간·낮음 우선순위와 별도 완료 여부, Supabase 계정별 저장·이메일/GitHub 인증을 사용한다. day14는 To-Do·In-Progress·Done 작업 상태와 제목·설명 수정, localStorage 저장을 사용한다.
- 드래그·반응형·머티리얼 계열 화면은 공통이며, 핵심 차이는 분류 기준과 저장·인증 구조임을 설명했다. 앱 코드는 변경하지 않았다.

## 006

### 프롬프트 원문

```text
npx
```

### 결과 요약

- npx의 용도와 정적 서버·Jest 실행 예시를 안내했다. 이 요청은 기록 누락을 현재 소급 추가하며 당시 명령은 실행하지 않았다.

## 007

### 프롬프트 원문

```text
앞으로는 브라우저에서의 테스트도 네가 할 수 있도록 playwright를 사용했으면 좋겟어. 그리고 테스트 시에는 반드시 red-green-refactor의 순서로, test first의 순서로 진행하는 것을 원칙으로 하자. playwright를 설치하고 User Flow 기반으로 E2E테스트를 추가하는걸로 계획을 변경하고 구현할거야. 내가 입력한 프롬프트 기반으로 설계문서들을 변경해줘. TASK.md에서는 내가 직접 해야하는 일이 있을것 같은데 이부분은 남은 작업 중 가장 앞쪽에 몰아서 배치해줘. 그후 네가 한번에 구현하는걸로 하자.
```

### 결과 요약

- AGENTS.md에 앞으로 적용할 test-first·Red → Green → Refactor, 실제 assertion Red와 환경 오류 구분, 기존 정상 동작의 회귀 기준선, 전체 Jest·Playwright 통과 완료 원칙을 반영했다.
- PLAN.md·PRD.md·TRD.md·USER_FLOW.md·DATABASE_DESIGN.md·DESIGN_SYSTEM.md에 프로젝트 로컬 @playwright/test·Chromium 설치, JavaScript E2E, 서버 자동 관리·독립 저장 상태·실패 산출물, UF-01~UF-12와 오류·취소·복원 검증 계약을 반영했다. 실제 CDN smoke와 고정 버전 실제 Materialize fixture를 구분했다.
- TASK.md를 새 남은 작업의 기준으로 생성했다. 사용자 직접 작업을 맨 앞에 모았으며 현재 필수 수동 설치·계정 설정은 없고 실제 추가 권한 승인과 선택 실기기 확인만 조건부 항목으로 명시했다. 이후 에이전트가 설치 → 테스트 먼저 작성·실행 → 실제 결함의 Red·최소 수정 Green·필요한 Refactor → 전체 검증까지 일괄 수행하도록 정리했다.
- TASKS.md는 기존 완료 이력으로 유지하고 새 TASK.md를 안내했다. 새 E2E 작업을 완료로 표시하지 않았다. 기록 누락된 npx 요청도 원문으로 소급 추가했다.
- Markdown 10개 파일의 제목·코드 블록·상대 링크 30개, UF ID 12개의 작업 매핑, 사용자 작업 우선 배치와 새 작업 미완료 표시를 검사해 통과했다.
- 이번 요청에서는 설계 문서와 작업 지침만 변경했다. Playwright 설치·앱 및 테스트 코드 변경·Jest/E2E 실행은 수행하지 않았다. 새 E2E 도입은 다음 구현 작업으로 남아 있다.

## 008

### 프롬프트 원문

```text
구현해줘
```

### 결과 요약

- TASK.md에 따라 프로젝트 로컬 Playwright Test 1.65.0·Materialize 2.2.2, Chromium v1254와 실행 라이브러리·한글 폰트를 설치했다. npm 설치·테스트·headed·보고서·통합 실행 명령과 프로젝트 로컬 실행 래퍼를 추가했다.
- UF-01~UF-12 기반 e2e/cards.spec.js·storage.spec.js·drag.spec.js·layout.spec.js·cdn.spec.js와 공통 fixture/helper를 먼저 작성했다. 두 Chromium 프로젝트에 각각 35개, 총 70개 E2E를 구성했다.
- 최초 69개 통과·1개 모바일 일반 스크롤 assertion 실패를 확인했다. 앱 변경 없이 실제 touch 입력으로 해당 테스트가 통과해 테스트 도구 문제로 분류했으며, 공통 touch helper를 Refactor한 후 전체 회귀를 실행했다. 아래 테스트 우선 실행 기록에 증거를 남겼다.
- 최종 `npm run test:all` 실행은 종료 코드 0으로 완료됐다. Jest 2개 스위트 59/59, Playwright desktop-chromium 35/35·mobile-chromium 35/35, 총 70/70이 통과했다. 필수 skip·fixme·only는 없다. 두 프로젝트의 실제 CDN smoke도 통과했다.
- 기존 Python 브라우저 검증 13개 조건을 이관한 뒤 tests/browser.py를 제거했다. 사본은 tdd-evidence/baseline/browser.py, 실패 screenshot·trace·보고서는 tdd-evidence/UF-12-1/red/, Green 근거는 tdd-evidence/UF-12-1/green/, 최종 전체 로그는 tdd-evidence/final/test-all.log에 보존했다. 최종 HTML 보고서는 playwright-report/index.html이다.
- PLAN.md·PRD.md·TRD.md·USER_FLOW.md·DATABASE_DESIGN.md·DESIGN_SYSTEM.md·TASK.md를 실제 설치·검증 결과와 실행 명령에 맞게 갱신했다. 앱 script.js·style.css·index.html은 SHA256으로 무변경을 확인했다.
- 물리 모바일 기기·Safari·headed GUI 모드는 미검증이며 자동 검증은 headless Chromium과 모바일 에뮬레이션에서 수행했다. 사용자 필수 수동 작업은 없으며 커밋·푸시·배포는 하지 않았다.

## 009

### 프롬프트 원문

```text
설치도하고
```

### 결과 요약

- 추가 요청대로 설치까지 완료했다. Playwright Test 1.65.0·Materialize 2.2.2·프로젝트 로컬 Chromium·Linux 라이브러리·한글 폰트를 준비했으며 최종 Jest 59개·E2E 70개가 모두 통과했다.


### 테스트 우선 실행 기록 — 008·009 완료

- 환경 준비: Node.js v22.23.4와 호환되는 @playwright/test 1.65.0, Materialize 2.2.2를 정확한 devDependency로 설치했다. Chromium v1254·FFmpeg를 node_modules/playwright-core/.local-browsers에 설치했다.
- sudo는 암호가 필요해 시스템 설치를 하지 않았다. Ubuntu 공식 .deb(libnspr4·libnss3·libasound2·fonts-nanum)를 프로젝트 playwright/.cache에 내려받아 사용자 범위로 준비했다. npm 실행 래퍼가 해당 경로와 폰트를 자동 적용하며 /tmp Python 경로에 의존하지 않는다.
- 기준선: npm test -- --runInBand에서 Jest 59개가 통과했다. 앱 코드를 수정하기 전에 UF-01~UF-12의 E2E 70개(각 프로젝트 35개)를 작성했다.
- 첫 실행 `npm run test:e2e -- --max-failures=5`: 69 passed, 1 failed. desktop 35개는 전부 Green, mobile 일반 스크롤 UF-12는 scrollY > 100 assertion에서 실제 0을 받아 실패했다. 실패 screenshot·trace·HTML 보고서는 tdd-evidence/UF-12-1/red/에 보존했다.
- 진단: 앱을 바꾸지 않고 Input.synthesizeScrollGesture 대신 실제 CDP touchStart·touchMove·touchEnd로 해당 입력을 보냈다. `npm run test:e2e -- --project=mobile-chromium --grep '핸들 밖'`에서 1 passed를 확인했다. 실패 원인은 테스트 입력 도구이며 제품 기능의 Red를 확인했다고 주장하지 않는다.
- Green 이후 Refactor: 일반 스크롤과 드래그가 공통 dispatchTouch helper를 사용하도록 중복을 정리했다. 후속 전체 검증으로 회귀를 확인한다. 최초부터 통과한 69개는 기존 동작의 Green 기준선으로 기록한다.
- 앱 변경 전 SHA256은 tdd-evidence/baseline/app-before-e2e.sha256, 실패·Green 근거는 tdd-evidence/UF-12-1/에 보존한다. 설치·DNS·서버 소켓 실패는 환경 오류로 구분했다.

- 최종 Refactor 재검증: npm run test:all에서 Jest 59개와 E2E 70개가 통과했다(종료 코드 0). 최초 실패는 테스트 입력 문제로 해결됐으며 제품 동작을 고의로 변경하지 않았다.

## 010

### 프롬프트 원문

```text
이 어플리케이션을 google, github, 이메일로 회원가입, 인증하여 로그인 할수 있게 해줘.
```

### 결과 요약

- 기존 Supabase 프로젝트를 재사용해 Google·GitHub OAuth(PKCE·계정 선택), 이메일 가입·인증 대기·메일 재발송·인증 후 로그인·세션 복원·현재 브라우저 로그아웃을 구현했다.
- config.js·auth.js·cloud.js·session.js·AUTH_SETUP.md·supabase/schema.sql을 추가하고 index.html·style.css·script.js를 인증/클라우드 생명주기에 맞게 변경했다. Supabase JS 2.119.0·PGlite 0.5.16을 정확한 개발 의존성으로 설치하고 Node.js >=22를 명시했다.
- 칸반은 별도 kanban_boards JSONB 테이블·RLS·사용자별 트랜잭션 잠금·버전 검사 저장 RPC를 사용한다. 서버 확정 후 화면에 반영하고 실패·충돌·시간 초과는 성공으로 표시하지 않으며 재조회 전 쓰기를 막는다. 사용자 전환·로그아웃 시 보드를 지우고 늦은 응답을 무시한다.
- 이전 브라우저 보드는 명시적 확인 후 빈 서버 보드에만 가져오고 원본을 보존한다. 가져오기 중 동시 편집·재조회를 막는다. 기존 todo 파일·테이블·함수·데이터를 수정하는 코드는 실행하지 않았다.
- Red: tests/auth-contract.test.cjs에서 auth-panel 부재 assertion 실패를 먼저 확인했다. cloud 오류 객체 계약 실패와 UF-11 오류가 숨겨진 화면 문제·UF-17 가져오기 중 편집 허용 문제를 재현하고 tdd-evidence/auth/red/에 로그·trace·화면·보고서를 보존했다.
- Green: 인증/클라우드 코드 추가, 서버 오류를 Error로 변환, UI 오류를 전역 영역으로 이동, 가져오기 동안 편집 차단으로 관련 desktop/mobile E2E 10개가 통과했다. Green 이후 이메일 주소 검증·서버 오류 변환을 공통 함수로 Refactor했다.
- 테스트 라우터 URL 이름 충돌·숨겨진 버튼 locator·열린 네이티브 모달 밖의 클릭은 테스트 도구 문제로 구분했다. 늦은 응답은 다른 탭의 실제 SDK 세션 종료(BroadcastChannel) 이벤트로 검증했다. Jest VM 동적 import·샌드박스 EPERM은 PostgreSQL 검증 자식 프로세스와 승인 실행으로 해결했다.
- 최종 `npm run test:all`은 종료 코드 0: Jest 6개 스위트 84/84, Playwright desktop 46/46·mobile 46/46 총 92/92, 실패·skip 0. 테스트에는 기존 보드 회귀·인증·클라우드 오류·RLS SQL 검증·실제 CDN 및 공개 Provider 설정 smoke가 포함된다.
- PostgreSQL(PGlite) 검증은 SQL 2회 적용·기존 todos 행/함수 보존·계정 A/B 격리·소유자 위조 거부·익명 차단·버전 충돌·입력 검증의 6개 시나리오를 실행했다. 운영 DB에 테스트 데이터를 생성하지 않았다.
- 읽기 전용 운영 확인은 Google/GitHub/Email 활성화·가입 허용·이메일 확인 필수와 kanban_boards 존재·익명 401/42501 거부를 확인했다. 실제 계정 OAuth 동의·메일 수신·운영 인증 토큰 CRUD/RLS는 사용자 확인 항목으로 분리했다.
- PLAN·PRD·TRD·USER_FLOW·DATABASE_DESIGN·DESIGN_SYSTEM·TASK와 AUTH_SETUP.md를 갱신했다. 전체 로그는 tdd-evidence/auth/final-all.log, 최종 보고서는 playwright-report/index.html, 실제 로그인 화면 캡처는 test-results/cdn--UF-13-운영-Provider-설정·실제-SDK·비로그인-화면-smoke-{desktop,mobile}-chromium/login-live.png에 있다. 커밋·푸시·배포는 하지 않았다.

## 011

### 프롬프트 원문

```text
재사용해, supabase에 사용자별 저장하는걸로해.
```

### 결과 요약

- 기존 Supabase 프로젝트·계정을 재사용하고 칸반 데이터도 사용자별 클라우드 저장으로 전환하도록 범위를 확정했다.

## 012

### 프롬프트 원문

```text
재사용하고, todo는 데이터 관리 어떻게 구성했지?
```

### 결과 요약

- 기존 todo의 사용자별 행 저장·RLS·RPC·버전 충돌 검사·세션 전환 시 이전 데이터 초기화·선택적 로컬 가져오기 구조를 소스로 확인해 설명했다. 기존 프로젝트를 재사용하되 칸반 저장은 분리한다.

## 013

### 프롬프트 원문

```text
기존 todo의 테이블과 데이터는 두고 kanban보드용을 구성해
```

### 결과 요약

- 전용 kanban_boards 테이블·RPC·RLS SQL을 작성하고 로컬 PostgreSQL에서 재실행·기존 todo 보존·사용자 격리·충돌을 검증했다. 기존 todos 테이블·함수·운영 데이터를 변경하는 작업은 하지 않았다. 최종 Jest 84개·E2E 92개가 통과했다.

## 014

### 프롬프트 원문

```text
구글, 깃허브, 이메일 전부 구성햇어
```

### 결과 요약

- 사용자 구성 완료 보고 후 실제 공개 Auth 설정에서 Google·GitHub·Email 활성화·가입 허용·Confirm email 필수를 확인했다. 운영 kanban_boards 익명 조회 거부도 확인했다. 실제 OAuth 동의·인증 메일 수신·운영 로그인 계정 CRUD는 별도 사용자 확인으로 남겼다.

## 015

### 프롬프트 원문

```text
테스트 끝났고 확인된문제 없으면, github pages로 배포하고, md파일들 전부 현재기준에 맞춰 최신화하도록한뒤, github YangSeungYeol/KanbanBoard에 커밋하고 commit log에 github pages 주소를 적어줘.
```

### 결과 요약

- 배포 전 Jest 84개·Playwright 92개가 통과했다. Markdown 13개를 최신화하고 앱·문서·테스트·SQL·설정 44개를 https://github.com/YangSeungYeol/KanbanBoard main에 게시했다. 앱 소스 커밋은 6185f0a03784d7814cea16d10ea00ad84eef1311이며 초기화·소스·후속 문서 커밋 메시지에 GitHub Pages: https://yangseungyeol.github.io/KanbanBoard/ 를 포함한다. Pages 실행 43162571976의 build·deploy·report-build-status 성공과 공개 URL HTTP 200을 확인했다. desktop/mobile 로그인 화면·공개 런타임 7개 SHA256 일치·OAuth Pages 복귀 경로·JavaScript 오류 및 가로 넘침 없음 확인을 통과했다. 사용자 Pages 설정과 Supabase 복귀 URL 저장 완료 보고도 반영했다. 실제 계정 OAuth 동의·메일 수신·운영 토큰 CRUD는 이 자동 검증과 구분한다.

## 016

### 프롬프트 원문

```text
앞으로 대화에 사용하는 언어는 한국어 기반으로 해줘
```

### 결과 요약

- 앞으로 대화·진행 안내·결과 설명은 한국어를 기본으로 하고 코드·파일명·서비스명 등은 필요한 경우 원래 표기를 유지한다. AGENTS.md에도 반영했다. 기존 배포 작업은 계속 유지하며 GitHub 앱의 KanbanBoard 접근 권한 변경을 기다린다.

## 017

### 프롬프트 원문

```text
Repository access의 선택 목록에 YangSeungYeol/KanbanBoard를 추가하는 방법좀 알려줄래
```

### 결과 요약

- GitHub 앱 설치 설정 174824706의 Repository access → Only select repositories → Select repositories에서 KanbanBoard 선택 후 Save하는 절차를 안내했다. 기존 TIL·todo 선택은 유지한다.
- 배포 전 Jest 84개·E2E 92개는 통과했고 /KanbanBoard/ 경로의 자산·320/375/1280px 화면·OAuth 복귀 경로 확인도 통과했다. 현재 원격 업로드 권한 반영을 기다리며 커밋·Pages 게시 완료로 표시하지 않는다.

## 018

### 프롬프트 원문

```text
추가햇어
```

### 결과 요약

- 접근 목록에 KanbanBoard 추가를 확인한 뒤 초기화·소스 커밋을 게시했다. 사용자에게 Pages 및 Supabase 설정을 요청했고 각각 “Pages 설정 저장했음”, “Pages 주소 추가하고 저장했음” 응답을 받았다. https://github.com/YangSeungYeol/KanbanBoard/actions/runs/43162571976 배포 성공과 https://yangseungyeol.github.io/KanbanBoard/ 실제 공개 화면 검증을 완료했다. 원격 44개 파일과 공개 런타임 7개가 로컬 원본과 일치한다. 최신 검증·게시 결과를 Markdown 13개에 반영하며 후속 문서 커밋에도 Pages 주소를 포함한다.
