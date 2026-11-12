const { test, expect, openBoard, addCard, stored, boardWith, sampleCard, cardByTitle, titles, backend } = require('./fixtures');

test('[UF-08] 클라우드 CRUD·설명·컬럼·순서 새로고침 복원', async ({ page }) => {
  await openBoard(page);await addCard(page, '보존 카드', '첫 설명');await addCard(page, '삭제 카드');await addCard(page, '완료 카드');
  await cardByTitle(page, '보존 카드').getByRole('button', { name: '보존 카드 수정', exact: true }).click();
  await page.getByLabel('설명 (선택)', { exact: true }).fill('바꾼 설명\n다음 줄');await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '삭제 카드 삭제', exact: true }).click();await page.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('combobox', { name: '완료 카드 상태', exact: true }).selectOption('done');await expect(titles(page, 'done')).toHaveText(['완료 카드']);
  const expected = await stored(page);await page.reload();await expect(titles(page, 'todo')).toHaveText(['보존 카드']);
  await expect(titles(page, 'done')).toHaveText(['완료 카드']);await expect(page.locator('.card-description')).toHaveText('바꾼 설명\n다음 줄');expect(await stored(page)).toBe(expected);
});
for (const [name, board] of [['버전', { ...boardWith(), version: 2 }], ['중복 ID', boardWith({ todo: [sampleCard('same')], done: [sampleCard('same')] })], ['필드', boardWith({ todo: [{ id: 'x', title: 'x', description: 7 }] })]]) {
  test(`[UF-09] 서버 ${name} 오류는 임의 덮어쓰기 없이 차단`, async ({ page }) => {
    backend(page).rows.set(require('./backend').users.a.id, { user_id: require('./backend').users.a.id, board, version: 1 });
    await page.goto('/');await expect(page.locator('#auth-error')).toBeVisible();await expect(page.locator('#board-workspace')).toBeHidden();
    expect(backend(page).writes).toHaveLength(0);
  });
}
test('[UF-10] 저장 실패·원본 보존·재조회 전 조작 차단·복구', async ({ page }) => {
  await openBoard(page);backend(page).failSave = 'network';
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();await page.getByLabel('제목 (필수)', { exact: true }).fill('실패한 변경');
  await page.getByRole('button', { name: '저장', exact: true }).click();await expect(page.locator('#storage-warning')).toBeVisible();
  expect(await stored(page)).toBeNull();await page.getByRole('button', { name: '취소', exact: true }).click();await expect(page.locator('#add-card')).toBeDisabled();
  backend(page).failSave = null;await page.getByRole('button', { name: '서버에서 다시 불러오기' }).click();await expect(page.locator('#add-card')).toBeEnabled();
  await addCard(page, '복구 변경');await expect(titles(page, 'todo')).toHaveText(['복구 변경']);
});
test('[UF-10] 버전 충돌은 기존 보드 보존 후 재조회', async ({ page }) => {
  await openBoard(page, boardWith({ todo: [sampleCard('a')] }));backend(page).failSave = 'VERSION_CONFLICT';
  await page.getByRole('combobox', { name: 'a 상태', exact: true }).selectOption('done');await expect(page.locator('#storage-warning')).toContainText('다른 곳');
  await expect(titles(page, 'todo')).toHaveText(['a']);await expect(titles(page, 'done')).toHaveCount(0);
});
test('[UF-10] 테이블 미설정은 보드 접근 차단·설정 안내', async ({ page }) => {
  backend(page).failLoad = 'PGRST205';await page.goto('/');await expect(page.locator('#auth-error')).toContainText('SQL');await expect(page.locator('#add-card')).toBeHidden();
});
test('[UF-11] Materialize 로드 실패 시 클라우드 보드 변경 없음', async ({ page }) => {
  await page.route('**/materialize.min.js', route => route.abort());await page.goto('/');await expect(page.locator('#load-error')).toBeVisible();expect(backend(page).writes).toHaveLength(0);
});
