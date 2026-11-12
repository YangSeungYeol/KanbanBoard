# Supabase 인증·칸반 저장 설정

기존 todo의 Supabase 프로젝트를 재사용합니다. 기존 public.todos와 todo 함수·데이터는 수정하지 않습니다. 계정은 공통 auth.users를 사용하고 칸반은 별도 public.kanban_boards에 사용자당 한 보드를 저장합니다.

## 사용자 선행 설정

1. [기존 프로젝트 SQL Editor](https://supabase.com/dashboard/project/jmteohphohvjokpthusa/sql/new)에서 [supabase/schema.sql](supabase/schema.sql) 전체를 실행합니다. 전용 테이블·검증·저장 함수·RLS만 생성합니다.
2. [Auth Provider](https://supabase.com/dashboard/project/jmteohphohvjokpthusa/auth/providers)에서 Email·Google·GitHub를 활성화합니다. 이메일 가입 허용과 Confirm email을 켭니다. 기존 GitHub 설정은 값이 올바르면 유지합니다.
3. [Auth URL 설정](https://supabase.com/dashboard/project/jmteohphohvjokpthusa/auth/url-configuration)의 Redirect URLs에 `http://localhost:8000/`와 `http://127.0.0.1:8000/`를 추가합니다. 기존 todo 주소는 지우지 않습니다. Site URL도 기존 todo 운영값을 임의 변경하지 않습니다. 칸반 코드가 자신의 복귀 주소를 전달합니다. 운영 Pages 주소 `https://yangseungyeol.github.io/KanbanBoard/`도 반드시 추가합니다. `/KanbanBoard/`의 대소문자와 마지막 슬래시를 유지합니다.
4. Google은 [Google Cloud 인증 정보](https://console.cloud.google.com/apis/credentials)에서 Web application OAuth client를 만들고 Authorized redirect URI에 `https://jmteohphohvjokpthusa.supabase.co/auth/v1/callback`을 넣습니다. 동의 화면·배포 상태·테스트 사용자도 설정하고 Client ID·Secret은 Supabase Google Provider에만 입력합니다.
5. GitHub는 [OAuth Apps](https://github.com/settings/developers)의 기존 앱을 확인합니다. Callback은 같은 Supabase callback 주소입니다. Client ID·Secret은 Supabase GitHub Provider에만 입력합니다.
6. 일반 사용자에게 가입 확인 메일을 보내려면 [Supabase SMTP 설정](https://supabase.com/dashboard/project/jmteohphohvjokpthusa/auth/smtp)에서 발송 서비스를 구성합니다. 기본 메일 서비스의 수신자·발송 제한은 공식 문서를 확인합니다. 발송 문제를 피하려고 이메일 확인을 끄지 않습니다.

Google/GitHub Client Secret·SMTP 암호·DB 암호·service_role 키는 채팅이나 프론트엔드에 넣지 않습니다. 공개 Supabase URL과 Publishable key만 config.js에서 사용합니다. 현재 에이전트에는 프로젝트 관리자 설정·SQL 실행 도구가 없어 이 설정은 사용자 계정에서 필요합니다.

## 로그인·저장 동작

- 이메일 가입 → 인증 메일 → 같은 브라우저에서 링크 열기 → 세션 복원·로그인. Google/GitHub는 해당 제공자에서 인증·동의하면 처음 사용자도 Supabase 계정이 생성됩니다.
- 로그아웃·계정 전환 시 보드를 즉시 지우고 서버에서 새 사용자 데이터만 읽습니다. 저장 실패·충돌·시간 초과는 성공으로 표시하지 않고 서버 다시 불러오기를 요구합니다.
- 기존 익명 브라우저 보드는 자동 귀속시키지 않습니다. 로그인 후 사용자가 명시적으로 가져오기를 선택하면 현재 클라우드 보드가 비어 있을 때만 저장합니다. 원본은 보존합니다.
- 테이블이나 Provider가 설정되지 않았으면 오류가 표시됩니다. 자동 테스트의 모의 인증·API 검증은 실제 OAuth·메일 수신·운영 DB RLS 확인과 구분합니다.

## 운영 확인

두 계정으로 로그인하여 A가 만든 보드를 B가 볼 수 없는지, 비로그인 요청이 거부되는지 확인합니다. 각 제공자의 실제 로그인·취소, 이메일 가입·메일 인증·로그인·로그아웃, 저장 후 새로고침·다른 기기 복원을 확인합니다. 로그인 성공만으로 DB 구성·격리 성공을 판단하지 않습니다.

공식 안내: [Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [GitHub](https://supabase.com/docs/guides/auth/social-sign-in/auth-github), [이메일](https://supabase.com/docs/guides/auth/passwords), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).


## 현재 확인 결과

- 사용자 보고와 실제 공개 Auth 설정 조회에서 Google·GitHub·Email 활성화, 가입 허용, 이메일 확인 필수를 확인했다.
- kanban_boards가 존재하고 비로그인 조회는 permission denied(401/42501)로 차단됨을 확인했다. 이 확인만으로 로그인 계정의 운영 CRUD·RLS 전체 성공을 단정하지 않는다.
- 로컬 PostgreSQL에서 제공 SQL 2회 적용, 기존 todo 행·함수 보존, A/B RLS, 버전 충돌, 잘못된 보드 거부를 검증했다.
- 최종 Jest 84개·Playwright 92개가 통과했다. 일반 인증 E2E는 실제 SDK를 쓰되 외부 응답을 테스트 경계에서 대체한다. 실제 Google/GitHub 계정 동의와 이메일 수신·링크 확인은 사용자 브라우저에서 마지막으로 확인한다.
- 설정 조회 재실행: `node scripts/check-auth-setup.cjs`. 앱 실행: `npm start` 후 `http://localhost:8000/`.


## GitHub Pages 운영 연결

앱 주소는 [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/)이며 저장소는 [https://github.com/YangSeungYeol/KanbanBoard](https://github.com/YangSeungYeol/KanbanBoard)입니다. Supabase Redirect URLs에 이 주소를 추가해야 OAuth·이메일 인증 후 칸반으로 돌아옵니다. 기존 todo Site URL·Redirect URLs와 OAuth Provider callback은 변경하지 않습니다. 복귀 URL 미등록 시 기존 Site URL로 이동할 수 있으므로 [배포 확인](DEPLOY.md) 절차로 실제 계정 복귀를 확인합니다.
