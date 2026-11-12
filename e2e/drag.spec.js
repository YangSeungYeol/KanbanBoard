const { test, expect, STATUSES, openBoard, boardWith, sampleCard, stored, column, titles, cardByTitle, startDrag, dragTo } = require('./fixtures');

for (const from of STATUSES) for (const to of STATUSES.filter(status => status !== from)) {
  test(`[UF-05] ${from} → ${to} 빈 컬럼 이동·저장`, async ({ page, isMobile }) => {
    await openBoard(page, boardWith({ [from]: [sampleCard('drag', '이동 카드')] }));
    await dragTo(page, cardByTitle(page, '이동 카드').getByRole('button', { name: '이동 카드 드래그 핸들' }), column(page, to), isMobile);
    await expect(titles(page, from)).toHaveCount(0);
    await expect(titles(page, to)).toHaveText(['이동 카드']);
    const saved = JSON.parse(await stored(page));
    expect(saved.columns[from]).toEqual([]);
    expect(saved.columns[to][0].id).toBe('drag');
    await expect(cardByTitle(page, '이동 카드').getByRole('button', { name: '이동 카드 드래그 핸들' })).toBeFocused();
  });
}
for (const direction of ['after', 'before']) {
  test(`[UF-05][UF-08] 같은 컬럼 ${direction} 재정렬·새로고침 복원`, async ({ page, isMobile }) => {
    await openBoard(page, boardWith({ todo: [sampleCard('a'), sampleCard('b')] }));
    const source = direction === 'after' ? 'a' : 'b';
    const target = direction === 'after' ? 'b' : 'a';
    await dragTo(page, cardByTitle(page, source).getByRole('button', { name: `${source} 드래그 핸들`, exact: true }), cardByTitle(page, target), isMobile, direction);
    await expect(titles(page, 'todo')).toHaveText(['b', 'a']);
    await page.reload();
    await expect(titles(page, 'todo')).toHaveText(['b', 'a']);
  });
}
for (const mode of ['threshold', 'escape', 'outside', 'cancel']) {
  test(`[UF-06] ${mode} 종료는 상태·저장 보존과 표시 정리`, async ({ page, isMobile }) => {
    await openBoard(page, boardWith({ todo: [sampleCard('a'), sampleCard('b')] }));
    const before = await stored(page);
    const drag = await startDrag(page, cardByTitle(page, 'a').getByRole('button', { name: 'a 드래그 핸들', exact: true }), isMobile);
    await drag.move(drag.point.x + (mode === 'threshold' ? 2 : 20), drag.point.y + (mode === 'threshold' ? 2 : 20));
    if (mode === 'threshold') await expect(page.locator('.drag-ghost')).toHaveCount(0);
    else await expect(page.locator('.drag-ghost')).toBeVisible();
    if (mode === 'escape') await page.keyboard.press('Escape');
    if (mode === 'outside') await drag.move(2, 100);
    if (mode === 'cancel') await drag.cancel(); else await drag.end();
    await expect(page.locator('.drag-ghost,.drop-indicator,.drop-target,.is-dragging')).toHaveCount(0);
    await expect(titles(page, 'todo')).toHaveText(['a', 'b']);
    expect(await stored(page)).toBe(before);
  });
}

test('[UF-12] 드래그 가장자리 자동 스크롤·취소 후 정지', async ({ page, isMobile }) => {
  await openBoard(page, boardWith({ todo: Array.from({ length: 7 }, (_, i) => sampleCard(`card-${i}`)) }));
  const drag = await startDrag(page, cardByTitle(page, 'card-0').getByRole('button', { name: 'card-0 드래그 핸들' }), isMobile);
  await drag.move(drag.point.x, page.viewportSize().height - 12);
  await expect(page.locator('.drag-ghost')).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(50);
  await drag.cancel();
  await expect(page.locator('.drag-ghost')).toHaveCount(0);
  const stopped = await page.evaluate(() => scrollY);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await page.evaluate(() => scrollY)).toBe(stopped);
  await expect(titles(page, 'todo')).toHaveCount(7);
});
