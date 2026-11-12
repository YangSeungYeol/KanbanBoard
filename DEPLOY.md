# GitHub Pages 배포

## 게시 완료 — 2026-11-12

- 운영 URL: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/)
- 저장소: [https://github.com/YangSeungYeol/KanbanBoard](https://github.com/YangSeungYeol/KanbanBoard)
- 앱 소스 커밋: [6185f0a](https://github.com/YangSeungYeol/KanbanBoard/commit/6185f0a03784d7814cea16d10ea00ad84eef1311)
- 검증한 Pages 실행: [43162571976](https://github.com/YangSeungYeol/KanbanBoard/actions/runs/43162571976) — completed/success
- build·deploy·report-build-status 및 Deploy to GitHub Pages 단계 모두 성공
- 게시 방식: Deploy from a branch → main → / (root), .nojekyll 사용

## 확인한 결과

- 배포 전 `npm run test:all`을 재실행해 Jest 84개·Playwright 92개가 통과했다.
- 앱·문서·테스트·SQL·설정 등 44개 원격 파일의 Git blob SHA를 로컬과 대조해 모두 일치했다.
- 실제 공개 URL은 HTTP 200, 제목은 칸반보드, 데스크톱 1280×1000·모바일 375×812에서 로그인 화면과 Google/GitHub 버튼을 확인했다.
- index.html·style.css·script.js·auth.js·cloud.js·session.js·config.js 7개를 공개 URL에서 받아 로컬 SHA256과 대조해 모두 일치했다.
- 두 화면의 가로 넘침과 JavaScript 오류가 없었다. Google·GitHub OAuth 요청은 PKCE와 `https://yangseungyeol.github.io/KanbanBoard/` 복귀 주소를 유지했다. 외부 계정 동의·로그인 완료는 이 검사에서 수행하지 않았다.
- 사용자가 Pages 게시 설정 저장과 Supabase Redirect URLs의 Pages 주소 등록 완료를 각각 확인했다. Supabase의 관리자 설정값을 에이전트가 직접 수정하지 않았다.

## 커밋과 게시 파일

앱 8개 파일(런타임 7개 및 .nojekyll), Markdown 전체 13개, 테스트·패키지 설정·실행 스크립트·SQL을 저장소 루트 기준으로 게시했다. node_modules·브라우저 바이너리·보고서·OS 캐시·tdd-evidence는 Git 제외했다. config.js에는 공개 URL·Publishable key만 포함한다.

초기화 커밋의 자식으로 소스 커밋을 만들고 force 없이 main을 갱신했다. 초기화·소스·후속 문서 커밋 메시지에 모두 `GitHub Pages: https://yangseungyeol.github.io/KanbanBoard/`를 포함한다. 문서만 갱신하는 후속 커밋은 앱 소스 커밋을 부모로 이어가며, 최신 커밋 SHA는 저장소 Git 로그에서 확인한다. 기존 교육 저장소의 다른 폴더와 todo 저장소는 변경하지 않았다.

## 설정과 후속 업데이트

- [Pages 설정](https://github.com/YangSeungYeol/KanbanBoard/settings/pages)은 main / root 게시를 유지한다. 별도 사용자 정의 Actions YAML은 없으며 GitHub 내부 Pages 실행이 자동 배포한다.
- [Supabase URL 설정](https://supabase.com/dashboard/project/jmteohphohvjokpthusa/auth/url-configuration)의 Redirect URLs에는 `https://yangseungyeol.github.io/KanbanBoard/`를 유지한다. 기존 todo Site URL·복귀 주소·OAuth callback은 지우거나 바꾸지 않는다.
- 이후 변경도 테스트 → 문서 갱신 → Pages 주소를 넣은 커밋 → main 게시 → [Actions](https://github.com/YangSeungYeol/KanbanBoard/actions)와 공개 화면 확인 순으로 진행한다. 원격 변경 통합은 merge를 사용하고 force push하지 않는다.
- 실제 계정 OAuth 동의·메일 수신·운영 토큰 CRUD/A·B 격리, 물리 기기·Safari 확인은 자동 검증과 별도 항목이다. 자세한 절차는 [AUTH_SETUP](AUTH_SETUP.md)·[TASK](TASK.md)를 따른다.

## 검증 기록과 권한 해결 이력

- 전체 테스트 로그: tdd-evidence/deployment/test-all.log
- 프로젝트 경로 사전 확인: tdd-evidence/deployment/project-path-result.json
- 공개 Pages 결과: tdd-evidence/deployment/live-pages-result.json
- 화면 캡처: tdd-evidence/deployment/pages-desktop.png·pages-mobile.png
- 최초 파일 생성은 연결 앱 접근 대상에 KanbanBoard가 없어 403이었다. 사용자가 설치 174824706의 대상에 저장소를 추가했고 목록 확인 후 업로드가 성공했다.

기록·산출물은 로컬 Git 제외 경로이며 저장소에는 문서의 검증 요약을 보존한다. Pages 게시 성공과 실제 계정의 인증 성공은 구분한다.

공식 기준: [GitHub Pages 게시 소스](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
