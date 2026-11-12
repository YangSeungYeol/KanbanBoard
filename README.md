# KanbanBoard

Google·GitHub·이메일 인증으로 로그인하고 사용자별 Supabase 보드를 관리하는 정적 칸반 앱입니다.

- Pages 게시 대상: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/)
- 저장소: [https://github.com/YangSeungYeol/KanbanBoard](https://github.com/YangSeungYeol/KanbanBoard)
- 게시 상태·확인 결과: [DEPLOY](DEPLOY.md)

## 기능

To-Do·In-Progress·Done, 카드 제목·설명 추가/수정/삭제, 마우스·터치 드래그/재정렬, 상태 메뉴, 반응형 화면·키보드 모달을 제공합니다. 이메일 확인·OAuth PKCE·로그아웃·계정별 클라우드 저장·버전 충돌 검사·이전 브라우저 보드의 선택적 가져오기를 지원합니다. 기존 todo의 테이블·함수·데이터는 변경하지 않습니다.

## 실행·테스트

Node.js 22 이상과 Python 3가 필요합니다. 앱은 빌드 없이 실행합니다.

```bash
npm ci
npm run test:e2e:install
npm run test:all
npm start
```

로컬 주소는 http://localhost:8000/ 입니다. Ubuntu 22.04에서 Chromium 라이브러리·한글 폰트가 부족하면 `npm run test:e2e:runtime`을 사용합니다. 보고서는 `npm run test:e2e:report`로 확인합니다.

자동 테스트 기준은 Jest 84개·Playwright 92개입니다. 일반 E2E는 실제 SDK를 실행하고 외부 인증/DB 응답만 대체합니다. SQL/RLS는 로컬 PostgreSQL로 실행하며 실제 CDN·공개 Provider 설정은 별도 smoke로 확인합니다. 실제 계정 OAuth 동의·메일 수신·운영 토큰 CRUD 검증과 구분합니다.

## 문서

[PLAN](PLAN.md) · [PRD](PRD.md) · [TRD](TRD.md) · [USER_FLOW](USER_FLOW.md) · [DATABASE_DESIGN](DATABASE_DESIGN.md) · [DESIGN_SYSTEM](DESIGN_SYSTEM.md) · [TASK](TASK.md) · [AUTH_SETUP](AUTH_SETUP.md) · [DEPLOY](DEPLOY.md)

TASKS.md는 초기 완료 이력, WORKFLOW.md는 요청·결과·검증 이력입니다. 운영 로그인은 Supabase Redirect URLs에 Pages 주소를 추가해야 하며 기존 todo 주소는 유지합니다.
