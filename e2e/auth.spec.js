const { test, expect, backend, addCard, titles, boardWith, sampleCard } = require('./fixtures');
const { users } = require('./backend');
test.use({ signedIn: false });
async function login(page, email = 'a@example.com', password = '12345678') {
  await page.getByLabel('이메일', { exact: true }).fill(email);await page.getByLabel('비밀번호', { exact: true }).fill(password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
}
test('[UF-13] 비로그인 보드 차단·Google/GitHub/이메일 진입 표시', async ({ page }) => {
  await page.goto('/');await expect(page.getByRole('button', { name: 'Google로 계속하기' })).toBeEnabled();await expect(page.getByRole('button', { name: 'GitHub로 계속하기' })).toBeEnabled();
  await expect(page.locator('#board-workspace')).toBeHidden();await expect(page.locator('#add-card')).toBeHidden();
});
test('[UF-14] 이메일 가입·비밀번호 확인·인증 대기·재발송', async ({ page }) => {
  await page.goto('/');await page.getByRole('button', { name: '회원가입', exact: true }).click();
  await page.getByLabel('이메일', { exact: true }).fill('a@example.com');await page.getByLabel('비밀번호', { exact: true }).fill('12345678');await page.getByLabel('비밀번호 확인', { exact: true }).fill('wrong');
  await page.getByRole('button', { name: '인증 메일 받고 가입' }).click();await expect(page.locator('#auth-error')).toContainText('일치');
  await page.getByLabel('비밀번호', { exact: true }).fill('12345678');await page.getByLabel('비밀번호 확인', { exact: true }).fill('12345678');
  await page.getByRole('button', { name: '인증 메일 받고 가입' }).click();await expect(page.locator('#auth-status')).toContainText('가입 확인 메일');
  await expect(page.locator('#board-workspace')).toBeHidden();await expect(page.getByLabel('비밀번호', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: '인증 메일 다시 보내기' }).click();await expect(page.locator('#auth-status')).toContainText('다시 요청');
});
test('[UF-14] 미인증 로그인 거부 후 인증된 계정 로그인·세션 복원', async ({ page }) => {
  backend(page).confirmed = false;await page.goto('/');await login(page);await expect(page.locator('#auth-error')).toContainText('인증');await expect(page.locator('#board-workspace')).toBeHidden();
  backend(page).confirmed = true;await login(page);await expect(page.locator('#account-label')).toHaveText('a@example.com');await addCard(page, '나의 보드');
  await page.reload();await expect(titles(page, 'todo')).toHaveText(['나의 보드']);
});
for (const provider of ['google', 'github']) {
  test(`[UF-15] ${provider} OAuth 계정 선택·PKCE·복귀 주소`, async ({ page }) => {
    await page.goto('/');const request = page.waitForRequest(req => req.url().includes('/auth/v1/authorize'));
    await page.getByRole('button', { name: provider === 'google' ? 'Google로 계속하기' : 'GitHub로 계속하기' }).click();
    const url = new URL((await request).url());expect(url.searchParams.get('provider')).toBe(provider);expect(url.searchParams.get('prompt')).toBe('select_account');
    expect(url.searchParams.get('redirect_to')).toBe('http://127.0.0.1:8014/');expect(url.searchParams.get('code_challenge_method')).toBe('s256');expect(url.searchParams.get('code_challenge')).toBeTruthy();
  });
}
test('[UF-16] 로그아웃·계정 전환 시 데이터 격리·원래 계정 복원', async ({ page }) => {
  await page.goto('/');await login(page);await addCard(page, 'A의 카드');await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page.locator('#board-workspace')).toBeHidden();await expect(page.locator('.kanban-card')).toHaveCount(0);
  await login(page, 'b@example.com');await expect(page.locator('.empty-state')).toHaveCount(3);await addCard(page, 'B의 카드');
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();await login(page);await expect(titles(page, 'todo')).toHaveText(['A의 카드']);
  expect(backend(page).rows.get(users.b.id).board.columns.todo[0].title).toBe('B의 카드');
});
test('[UF-16] 늦은 저장 응답은 로그아웃 후 보드를 되살리지 않음', async ({ page }) => {
  await page.goto('/');await login(page);await expect(page.locator('#add-card')).toBeEnabled();let release;backend(page).holdSave = new Promise(r => { release = r; });
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();await page.getByLabel('제목 (필수)', { exact: true }).fill('늦은 변경');await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled();
  // 열린 네이티브 모달 밖을 클릭하지 않고, 다른 탭의 실제 SDK 로그아웃 이벤트를 재현합니다.
  await page.evaluate(() => { localStorage.removeItem('kanban-auth:v1');const channel = new BroadcastChannel('kanban-auth:v1');channel.postMessage({ event: 'SIGNED_OUT', session: null });channel.close(); });
  await expect(page.locator('#auth-panel')).toBeVisible();release();
  await expect(page.locator('#board-workspace')).toBeHidden();await expect(page.locator('.kanban-card')).toHaveCount(0);
});
test('[UF-17] 이전 브라우저 보드는 명시적으로만 가져오고 원본 보존', async ({ page }) => {
  const legacy = JSON.stringify(boardWith({ todo: [sampleCard('legacy', '이전 보드')] }));await page.addInitScript(value => localStorage.setItem('kanban-board:v1', value), legacy);
  await page.goto('/');await login(page);await expect(page.locator('.empty-state')).toHaveCount(3);expect(backend(page).writes).toHaveLength(0);
  page.once('dialog', dialog => dialog.accept());await page.getByRole('button', { name: '이전 보드 가져오기' }).click();await expect(titles(page, 'todo')).toHaveText(['이전 보드']);
  expect(await page.evaluate(() => localStorage.getItem('kanban-board:v1'))).toBe(legacy);
});
test('[UF-15] OAuth 취소 복귀는 오류 안내·로그인 재시도 가능', async ({ page }) => {
  await page.goto('/?error=access_denied&error_description=Cancelled');await expect(page.locator('#auth-error')).toContainText('취소');await login(page);await expect(page.locator('#add-card')).toBeEnabled();
});


test('[UF-17] 이전 보드 가져오기 중 동시 편집 차단', async ({ page }) => {
  const legacy = JSON.stringify(boardWith({ todo: [sampleCard('legacy', '이전 카드')] }));
  await page.addInitScript(value => localStorage.setItem('kanban-board:v1', value), legacy);
  await page.goto('/');await login(page);await expect(page.locator('#add-card')).toBeEnabled();
  let release;backend(page).holdSave = new Promise(resolve => { release = resolve; });
  page.once('dialog', dialog => dialog.accept());await page.getByRole('button', { name: '이전 보드 가져오기' }).click();
  try { await expect(page.locator('#add-card')).toBeHidden(); }
  finally { release(); }
  await expect(titles(page, 'todo')).toHaveText(['이전 카드']);
});

test('[UF-13] 인증 SDK 로드 실패 시 보드·로그인 요청 차단', async ({ page }) => {
  await page.route('**/@supabase/supabase-js@2.119.0/dist/umd/supabase.js', route => route.abort());
  await page.goto('/');await expect(page.locator('#auth-error')).toContainText('설정');
  await expect(page.locator('#board-workspace')).toBeHidden();await expect(page.locator('#auth-submit')).toBeDisabled();
});
