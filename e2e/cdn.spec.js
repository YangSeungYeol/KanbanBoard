// 이 smoke는 fixture의 로컬 응답을 사용하지 않고 실제 CDN을 확인합니다.
const { test, expect } = require('@playwright/test');
const { installBackend } = require('./backend');

test('[UF-11] 실제 Materialize CDN 로드·초기화·카드 추가 smoke', async ({ page }) => {
  await installBackend(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const responses = [];
  page.on('response', response => { if (response.url().includes('@materializecss/materialize@2.2.2/dist/')) responses.push(response); });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '카드 추가', exact: true })).toBeEnabled();
  expect(responses).toHaveLength(2);
  expect(responses.every(response => response.ok())).toBe(true);
  expect(await page.evaluate(() => !!window.M?.Modal)).toBe(true);
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();
  await page.getByLabel('제목 (필수)', { exact: true }).fill('CDN 확인');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('article', { name: 'CDN 확인', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('[UF-13] 운영 Provider 설정·실제 SDK·비로그인 화면 smoke', async ({ page }, testInfo) => {
  const errors = [];page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Google로 계속하기' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'GitHub로 계속하기' })).toBeEnabled();
  await expect(page.locator('#board-workspace')).toBeHidden();
  const config = await page.evaluate(() => window.KANBAN_CONFIG);
  const response = await page.request.get(config.supabaseUrl + '/auth/v1/settings', { headers: { apikey: config.supabasePublishableKey } });
  expect(response.ok()).toBe(true);
  const settings = await response.json();
  expect(settings.external.google).toBe(true);expect(settings.external.github).toBe(true);expect(settings.external.email).toBe(true);
  expect(settings.mailer_autoconfirm).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('login-live.png'), fullPage: true });
  expect(errors).toEqual([]);
});
