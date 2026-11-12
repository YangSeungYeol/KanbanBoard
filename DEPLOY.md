# GitHub Pages 배포

## 게시 대상과 현재 상태

- 저장소: [https://github.com/YangSeungYeol/KanbanBoard](https://github.com/YangSeungYeol/KanbanBoard)
- Pages 주소: [https://yangseungyeol.github.io/KanbanBoard/](https://yangseungyeol.github.io/KanbanBoard/)
- 게시 방식: Deploy from a branch → main → / (root), .nojekyll 사용
- 현재 상태: 배포 전 Jest 84개·Playwright 92개 재검증과 문서 최신화 완료. 최초 403 오류 후 사용자가 접근 저장소에 KanbanBoard를 추가했고 설치 목록에서 반영을 확인함. 원격 커밋·Pages 활성화·공개 접속 검증은 미완료.

## 게시 파일과 커밋

앱 8개 파일(index.html·style.css·script.js·auth.js·cloud.js·session.js·config.js·.nojekyll), Markdown 전체, 테스트·설정·설치 스크립트·SQL을 저장소 루트 기준으로 게시합니다. node_modules·브라우저 바이너리·보고서·OS 캐시·tdd-evidence는 제외합니다. config.js는 공개 URL·Publishable key만 포함합니다.

연결된 GitHub API로 새 저장소 main을 초기화하고 파일 트리를 커밋합니다. 기존 커밋이 있다면 부모로 이어가며 force 없이 ref를 갱신합니다. 커밋 메시지에는 `GitHub Pages: https://yangseungyeol.github.io/KanbanBoard/`를 포함합니다. 기존 교육 저장소나 todo 저장소의 변경은 포함하지 않습니다.

## 최초 관리자 설정

1. main 업로드 후 [Pages 설정](https://github.com/YangSeungYeol/KanbanBoard/settings/pages)을 엽니다.
2. Source는 Deploy from a branch, Branch는 main, Folder는 / (root)를 선택하고 Save합니다.
3. [Supabase URL 설정](https://supabase.com/dashboard/project/jmteohphohvjokpthusa/auth/url-configuration)의 Redirect URLs에 `https://yangseungyeol.github.io/KanbanBoard/`를 추가합니다. 기존 todo Site URL·복귀 주소·OAuth callback은 지우거나 바꾸지 않습니다.
4. [Actions](https://github.com/YangSeungYeol/KanbanBoard/actions)에서 Pages build/deploy가 성공했는지 확인하고 공개 주소에서 로그인 화면·정적 파일을 확인합니다.

현재 GitHub 연결 도구에는 Pages 설정 변경 기능이 없어 최초 설정은 관리자 화면에서 필요합니다. 별도 사용자 정의 Actions YAML은 생성하지 않습니다. branch 게시도 GitHub 내부 Pages 배포 실행을 사용합니다.

## 검증과 범위

- 게시 전 Jest 84개·Playwright 92개를 재실행하고 전체 통과한 소스만 게시합니다.
- 원격 커밋의 파일 SHA와 로컬 게시 파일을 대조합니다.
- GitHub 배포 실행과 공개 URL 응답, 실제 Chromium 로그인 화면·자산 로드를 확인합니다.
- 실계정 OAuth·메일 수신·로그인 계정 CRUD·A/B 격리는 별도 확인 항목입니다. Pages HTML이 열린 사실만으로 이를 완료 표시하지 않습니다.
- 실패 시 [Actions](https://github.com/YangSeungYeol/KanbanBoard/actions)와 [TASK](TASK.md)의 남은 항목을 확인합니다. 배포 상태를 확인한 후 이 문서와 작업 기록을 후속 문서 커밋으로 갱신합니다.

공식 기준: [GitHub Pages 게시 소스](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).


## 현재 업로드 권한 확인

앱 설치 174824706의 최초 목록은 TIL·todo였으며 파일 생성 요청이 403으로 거부됐다. 사용자 변경 후 TIL·todo·KanbanBoard가 포함된 것을 확인해 업로드를 재개했다.


## Pages 프로젝트 경로 사전 확인

`/KanbanBoard/` 경로로 앱을 제공하는 로컬 브라우저 검증에서 자산 누락·JavaScript 오류가 없고 320·375·1280px 가로 넘침이 없음을 확인했다. OAuth 복귀 경로는 `https://yangseungyeol.github.io/KanbanBoard/`를 유지한다. 결과는 tdd-evidence/deployment/project-path-result.json에 있다. 이 결과는 원격 Pages 게시 완료를 뜻하지 않는다.
