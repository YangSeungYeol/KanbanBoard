const { test, expect, openBoard, addCard, boardWith, sampleCard, scrollPage } = require('./fixtures');

for (const width of [320, 375, 768, 1280]) {
  test(`[UF-12] ${width}px 배치·긴 텍스트·44px 조작부·열린 모달`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openBoard(page, boardWith({ todo: [{ ...sampleCard('long', '제목'.repeat(100)), description: '긴 설명\n'.repeat(100) }] }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const boxes = await page.locator('.kanban-column').evaluateAll(nodes => nodes.map(node => ({ x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y })));
    if (width < 768) expect(boxes[0].y < boxes[1].y && boxes[1].y < boxes[2].y).toBe(true);
    else expect(new Set(boxes.map(box => Math.round(box.y))).size).toBe(1);
    const sizes = await page.locator('#add-card,.icon-button,.status-select').evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { width: rect.width, height: rect.height }; }));
    for (const size of sizes) { expect(size.width).toBeGreaterThanOrEqual(44); expect(size.height).toBeGreaterThanOrEqual(44); }
    await page.getByRole('button', { name: '카드 추가', exact: true }).click();
    await page.getByLabel('설명 (선택)', { exact: true }).fill('긴 설명\n'.repeat(100));
    const dialog = await page.getByRole('dialog').boundingBox();
    expect(dialog.width).toBeLessThanOrEqual(width - 16);
    expect(dialog.height).toBeLessThanOrEqual(900 * .85 + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: '저장', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: '저장', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '카드 추가', exact: true })).toBeFocused();
  });
}

test('[UF-12] 모달 레이블·Tab 순환·Escape·포커스 복원·reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openBoard(page);
  await addCard(page, '포커스 카드');
  expect(await page.locator('.kanban-card').evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();
  await expect(page.getByLabel('제목 (필수)', { exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('제목 (필수)', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '카드 추가', exact: true })).toBeFocused();
});

test('[UF-12] 핸들 밖의 일반 페이지 스크롤', async ({ page, isMobile }) => {
  await openBoard(page, boardWith({ todo: Array.from({ length: 8 }, (_, i) => sampleCard(`long-${i}`)) }));
  await scrollPage(page, isMobile);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect(page.locator('.drag-ghost')).toHaveCount(0);
});
