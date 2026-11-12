# 칸반보드 구현 계획과 현재 구성

## 목표

HTML·CSS·JavaScript로 To-Do·In-Progress·Done 칸반보드를 제공한다. Google·GitHub·이메일 인증으로 로그인하고 기존 Supabase 프로젝트의 칸반 전용 저장소에 사용자별 보드를 저장한다. 기존 todo 테이블·함수·데이터는 변경하지 않는다.

## 앱과 인증

- index.html·style.css·script.js의 화면·스타일·보드 동작 분리를 유지한다. Materialize 2.2.2와 Supabase JS 2.119.0을 고정 CDN으로 읽고 빌드 없이 실행한다.
- config.js는 공개 URL·Publishable key만, auth.js는 이메일·OAuth API, cloud.js는 전용 보드 조회·저장, session.js는 로그인 화면·세션 전환·보드 생명주기를 담당한다.
- 이메일 가입은 8자 이상 비밀번호와 확인을 검사한다. 확인 메일 안내·재발송을 제공하며 인증되지 않은 계정은 보드를 열지 않는다.
- Google·GitHub는 Supabase PKCE OAuth와 계정 선택 요청을 사용한다. 처음 인증하면 Supabase 계정이 생성된다. 세션을 복원하고 현재 브라우저 로그아웃을 제공한다.
- 로그인 전에는 보드와 추가 버튼을 숨긴다. 비밀번호는 서버 인증 API에만 전달하고 요청 후 입력을 비운다. 설정·토큰·비밀번호를 결과 로그에 출력하지 않는다.

## 보드·클라우드 저장

- 제목·설명 추가·수정·삭제, 마우스/터치 드래그·컬럼 간 이동·재정렬·빈 컬럼 드롭·취소·자동 스크롤·상태 메뉴를 유지한다.
- 768px 이상 3열, 미만 세로 배치와 44px 조작부·모달 포커스·이동 알림을 유지한다.
- 전용 kanban_boards JSONB와 저장 RPC·RLS로 로그인 사용자 데이터만 읽고 쓴다. 서버가 확정한 상태만 화면에 반영한다.
- 저장 중 중복 편집을 막는다. 실패·충돌·시간 초과는 성공으로 표시하지 않고 서버 재조회를 요구한다. 로그아웃·전환 시 이전 데이터를 지우고 늦은 응답을 무시한다.
- 이전 브라우저 보드는 사용자 확인으로 빈 서버 보드에만 가져온다. 자동 귀속·원본 삭제·저장 실패 시 로컬 대체를 하지 않는다.

## 테스트 원칙과 검증 범위

- 기능 변경은 test-first·Red → Green → Refactor로 진행한다. assertion 실패와 환경·테스트 도구 실패를 구분하고 WORKFLOW.md에 증거를 남긴다.
- Jest·jsdom은 보드·인증·저장·세션 경계를 검증한다. SQL/RLS는 로컬 PostgreSQL에서 실제 SQL을 실행한다.
- Playwright Test 1.65.0은 desktop/mobile Chromium 두 프로젝트에서 User Flow를 검증한다. 일반 E2E는 실제 Materialize·Supabase SDK를 읽고 외부 API만 대체한다. CDN·운영 Provider 상태는 별도 읽기 전용 smoke로 검증한다.
- 운영 Provider 활성화와 Confirm email 필수 상태·칸반 테이블 존재·익명 차단을 확인했다. 실제 Google/GitHub 인증·메일 수신·운영 DB CRUD는 실계정 확인과 구분한다.
- 전체 Jest·필수 E2E 통과 후 코드 완료를 기록한다. 운영 검증의 남은 항목을 완료로 표시하지 않는다. [TASK](TASK.md)가 현재 상태의 기준이다.

## 실행

Node.js 22 이상에서 day14 디렉터리를 기준으로 실행한다.

```bash
npm ci
npm run test:e2e:install
npm run test:all
npm start
```

`http://localhost:8000/`에 접속한다. Supabase 복귀 주소 설정은 [AUTH_SETUP](AUTH_SETUP.md)를 따른다. Ubuntu 22.04에서 라이브러리·한글 폰트가 없고 sudo를 사용할 수 없으면 `npm run test:e2e:runtime`으로 공식 패키지를 프로젝트 내부에 준비한다.

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
node scripts/check-auth-setup.cjs
```

테스트 서버는 Playwright가 127.0.0.1:8014에서 자동 관리한다. 설치·실행은 /tmp Python 경로에 의존하지 않는다. headed는 GUI 환경이 필요하다. 로그인·CDN에는 네트워크 연결이 필요하다.

관련 문서: [PRD](PRD.md), [TRD](TRD.md), [USER_FLOW](USER_FLOW.md), [DATABASE_DESIGN](DATABASE_DESIGN.md), [DESIGN_SYSTEM](DESIGN_SYSTEM.md).


## 운영 게시 기준

- 저장소: [https://github.com/YangSeungYeol/KanbanBoard](https://github.com/YangSeungYeol/KanbanBoard), 게시 대상: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/). GitHub Pages main 브랜치 루트에서 정적 파일을 제공한다.
- 최신 자동 테스트 기준은 Jest 84개·Playwright 92개이며 실제 배포 상태는 [DEPLOY](DEPLOY.md)를 따른다.
- Pages 화면 접속과 실제 계정 인증·이메일 수신·운영 데이터 CRUD는 구분한다. 운영 인증 복귀 주소에 `https://yangseungyeol.github.io/KanbanBoard/`를 추가하고 기존 todo 주소는 유지한다.
