const { test, expect, KEY, openBoard, addCard, stored, column, titles, cardByTitle } = require('./fixtures');

test('[UF-01] 첫 방문의 빈 컬럼과 라이브러리 준비 전후 버튼', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/materialize.min.js', async route => { await gate; await route.fallback(); });
  await page.goto('/', { waitUntil: 'commit' });
  await expect(page.locator('#add-card')).toBeDisabled();
  release();
  await expect(page.getByRole('button', { name: '카드 추가', exact: true })).toBeEnabled();
  await expect(page.locator('.empty-state')).toHaveCount(3);
  await expect(page.locator('.count')).toHaveText(['0', '0', '0']);
  expect(await stored(page)).toBeNull();
});

test('[UF-02] 제목 trim·설명·To-Do 끝 추가·HTML 텍스트 표시', async ({ page }) => {
  await openBoard(page);
  await addCard(page, '  첫 카드  ', '첫 줄\n둘째 줄');
  const payload = '<img src=x onerror="window.injected=true">';
  await addCard(page, payload);
  await expect(titles(page, 'todo')).toHaveText(['첫 카드', payload]);
  await expect(page.locator('.card-description')).toHaveText('첫 줄\n둘째 줄');
  await expect(column(page, 'todo').locator('.count')).toHaveText('2');
  await expect(page.locator('#board img')).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  expect(JSON.parse(await stored(page)).columns.todo).toHaveLength(2);
});

test('[UF-02] 공백 제목 오류·수정 입력·추가 취소·Escape', async ({ page }) => {
  await openBoard(page);
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();
  const title = page.getByLabel('제목 (필수)', { exact: true });
  await title.fill('   ');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.locator('#title-error')).toBeVisible();
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  await title.fill('아직 저장 안 함');
  await expect(page.locator('#title-error')).toBeHidden();
  await page.getByRole('button', { name: '취소', exact: true }).click();
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();
  await expect(title).toHaveValue('');
  await title.fill('Escape 취소');
  await page.keyboard.press('Escape');
  await expect(page.locator('.kanban-card')).toHaveCount(0);
  expect(await stored(page)).toBeNull();
});

test('[UF-03] 내용 수정·위치 유지·취소·Escape·포커스 복원', async ({ page }) => {
  await openBoard(page);
  await addCard(page, '첫 카드', '원본 설명');
  await addCard(page, '둘째 카드');
  const original = await stored(page);
  await cardByTitle(page, '첫 카드').getByRole('button', { name: '첫 카드 수정', exact: true }).click();
  await page.getByLabel('제목 (필수)', { exact: true }).fill('취소 내용');
  await page.getByRole('button', { name: '취소', exact: true }).click();
  expect(await stored(page)).toBe(original);
  await cardByTitle(page, '첫 카드').getByRole('button', { name: '첫 카드 수정', exact: true }).click();
  await page.getByLabel('설명 (선택)', { exact: true }).fill('취소 설명');
  await page.keyboard.press('Escape');
  expect(await stored(page)).toBe(original);
  await cardByTitle(page, '첫 카드').getByRole('button', { name: '첫 카드 수정', exact: true }).click();
  await page.getByLabel('제목 (필수)', { exact: true }).fill('수정 카드');
  await page.getByLabel('설명 (선택)', { exact: true }).fill('바뀐 설명');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(titles(page, 'todo')).toHaveText(['수정 카드', '둘째 카드']);
  await expect(cardByTitle(page, '수정 카드').locator('.card-description')).toHaveText('바뀐 설명');
  await expect(page.getByRole('button', { name: '수정 카드 수정', exact: true })).toBeFocused();
});

test('[UF-04] 삭제 취소·Escape·확인·전체 빈 상태와 포커스', async ({ page }) => {
  await openBoard(page);
  await addCard(page, '삭제 대상');
  const saved = await stored(page);
  for (const cancel of ['button', 'escape']) {
    await page.getByRole('button', { name: '삭제 대상 삭제', exact: true }).click();
    await expect(page.getByRole('button', { name: '취소', exact: true })).toBeFocused();
    if (cancel === 'button') await page.getByRole('button', { name: '취소', exact: true }).click();
    else await page.keyboard.press('Escape');
    expect(await stored(page)).toBe(saved);
  }
  await page.getByRole('button', { name: '삭제 대상 삭제', exact: true }).click();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await expect(page.locator('.empty-state')).toHaveCount(3);
  await expect(page.locator('.count')).toHaveText(['0', '0', '0']);
  await expect(page.locator('#heading-todo')).toBeFocused();
  await page.reload();
  await expect(page.locator('.kanban-card')).toHaveCount(0);
});

test('[UF-07] 상태 메뉴 키보드 이동·현재 상태 재선택·끝 추가·알림', async ({ page }) => {
  await openBoard(page);
  await addCard(page, '첫 카드');
  await addCard(page, '둘째 카드');
  const initial = await stored(page);
  const first = page.getByRole('combobox', { name: '첫 카드 상태', exact: true });
  await first.selectOption('todo');
  expect(await stored(page)).toBe(initial);
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(titles(page, 'in-progress')).toHaveText(['첫 카드']);
  await expect(first).toBeFocused();
  await expect(page.locator('#announcement')).toHaveText('첫 카드: In-Progress로 이동했습니다.');
  await page.getByRole('combobox', { name: '둘째 카드 상태', exact: true }).selectOption('in-progress');
  await expect(titles(page, 'in-progress')).toHaveText(['첫 카드', '둘째 카드']);
});
