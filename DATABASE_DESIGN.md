# DataBase Design — 사용자별 칸반 클라우드 저장

## 현재 구성과 todo 분리

기존 Supabase 프로젝트 `jmteohphohvjokpthusa`의 Auth를 재사용한다. 기존 public.todos·todo 함수·데이터를 변경하지 않는다. 칸반은 전용 public.kanban_boards와 save_kanban_board RPC만 사용한다. 사용자당 한 보드를 JSONB 한 행으로 저장하여 컬럼 이동·재정렬을 한 트랜잭션으로 확정한다.

## 테이블과 보드 계약

| 필드 | 타입 | 규칙 |
|---|---|---|
| user_id | uuid PK | auth.users(id) 참조·삭제 시 cascade, 기본 auth.uid() |
| board | jsonb | 아래 버전 1 보드, 서버 검증 함수의 CHECK 적용 |
| version | bigint | 최초 1, UPDATE 트리거에서 +1, 동시 수정 검사 |
| created_at | timestamptz | 서버 생성 시각 |
| updated_at | timestamptz | 서버 수정 시각 |

```json
{
  "version": 1,
  "columns": {
    "todo": [{ "id": "고유-ID", "title": "작업 제목", "description": "선택 설명" }],
    "in-progress": [],
    "done": []
  }
}
```

배열 인덱스가 표시 순서다. 카드의 컬럼·순서 필드를 중복 저장하지 않는다. 제목은 trim 후 필수, 설명은 빈 문자열·줄바꿈을 허용하고 ID는 전체 보드 내 고유 문자열이다. board.version은 데이터 형식 버전이며 테이블 version은 저장 충돌 검사 버전이다.

## 권한과 저장 함수

- RLS: SELECT·INSERT·UPDATE는 authenticated의 auth.uid()와 user_id가 같은 행에만 허용한다. UPDATE의 USING과 WITH CHECK를 모두 검사해 소유자 바꾸기를 차단한다. anon·public의 테이블 및 함수 권한은 회수한다.
- RPC `save_kanban_board(p_board jsonb, p_expected_version bigint)`는 SECURITY INVOKER, 빈 search_path로 실행한다. 소유자를 클라이언트가 파라미터로 지정하지 않고 auth.uid()에서 얻는다.
- 사용자별 advisory transaction lock과 행 잠금을 잡고 버전을 확인한다. 행이 없을 때 기대 버전은 0, 기존 행은 현재 버전과 일치해야 한다. 충돌은 VERSION_CONFLICT다.
- 입력 검증·저장·버전 증가가 원자적으로 실행된다. 반환된 소유자·보드·버전을 클라이언트가 검증한 뒤 화면에 반영한다.
- 실패·시간 초과에서는 저장 여부를 확정할 수 없으므로 성공 표시·로컬 자동 대체를 하지 않는다. 재조회 전 추가 쓰기를 차단한다. 여러 기기에서 같은 계정의 서버 데이터를 읽는다.

## 인증·세션과 이전 데이터

Supabase Auth가 Google·GitHub·이메일 계정과 토큰을 관리한다. 앱 테이블에는 비밀번호·OAuth secret을 저장하지 않는다. SDK PKCE 세션 저장 키는 `kanban-auth:v1`로 기존 todo 세션 키와 구분한다. 로그아웃·사용자 전환 시 메모리 보드와 진행 중 응답 세대를 폐기한다.

이전 localStorage `kanban-board:v1`은 읽기·가져오기 대상으로만 유지한다. 로그인한 사용자가 명시적으로 확인하고 현재 서버 보드가 비어 있을 때만 RPC로 가져온다. 가져오는 동안 편집과 재조회를 막고 원본은 지우지 않는다. 손상된 이전 데이터는 자동 가져오지 않는다.

## 적용·검증

- 적용 SQL은 [supabase/schema.sql](supabase/schema.sql), 관리자 설정은 [AUTH_SETUP](AUTH_SETUP.md)를 따른다.
- tests/schema.test.cjs는 별도 로컬 PGlite PostgreSQL 프로세스에서 SQL 2회 적용·기존 todo 행과 함수 보존·A/B RLS·비로그인 차단·버전 충돌·입력 검증을 실행한다. 운영 DB의 사용자 데이터에 테스트 행을 쓰지 않는다.
- E2E의 외부 Auth/PostgREST 응답은 테스트 경계에서 대체하지만 실제 Supabase SDK와 앱을 실행한다. 이 모의 검증은 운영 계정·실제 DB의 RLS 검증과 구분한다.
- 운영 읽기 확인에서 kanban_boards가 존재하고 익명 조회가 permission denied로 차단되는 것을 확인했다. 실제 로그인 토큰을 사용한 운영 CRUD·A/B 격리는 별도 실계정 확인 대상이다.

관련 문서: [TRD](TRD.md), [USER_FLOW](USER_FLOW.md), [TASK](TASK.md).


## 운영 게시 기준

- 저장소: [https://github.com/YangSeungYeol/KanbanBoard](https://github.com/YangSeungYeol/KanbanBoard), 게시 대상: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/). GitHub Pages main 브랜치 루트에서 정적 파일을 제공한다.
- 최신 자동 테스트 기준은 Jest 84개·Playwright 92개이며 실제 배포 상태는 [DEPLOY](DEPLOY.md)를 따른다.
- Pages 화면 접속과 실제 계정 인증·이메일 수신·운영 데이터 CRUD는 구분한다. 운영 인증 복귀 주소에 `https://yangseungyeol.github.io/KanbanBoard/`를 추가하고 기존 todo 주소는 유지한다.
