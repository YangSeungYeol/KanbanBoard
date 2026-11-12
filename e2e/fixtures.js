const { test: base, expect } = require('@playwright/test');
const path = require('node:path');
const { installBackend, backend, users } = require('./backend');

const KEY = 'kanban-board:v1';
const STATUSES = ['todo', 'in-progress', 'done'];
const materializeDist = path.resolve(path.dirname(require.resolve('@materializecss/materialize')), '..');

const test = base.extend({
  signedIn: [true, { option: true }],
  cloudBackend: [async ({ page, signedIn }, use) => { const state = await installBackend(page, { signedIn });await use(state); }, { auto: true }],
  supabaseSdk: [async ({ page }, use) => {
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.js', route => route.fulfill({ path: path.join(__dirname, '../node_modules/@supabase/supabase-js/dist/umd/supabase.js') }));
    await use();
  }, { auto: true }],
  materialize: [async ({ page }, use) => {
    await page.route('https://cdn.jsdelivr.net/npm/@materializecss/materialize@2.2.2/dist/**', route => {
      const asset = new URL(route.request().url()).pathname.split('/dist/')[1];
      return route.fulfill({ path: path.join(materializeDist, asset) });
    });
    await use();
  }, { auto: true }],
  pageErrors: [async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(errors);
    expect(errors, '예기치 않은 브라우저 JavaScript 오류').toEqual([]);
  }, { auto: true }],
});

const column = (page, status) => page.locator(`[data-status="${status}"]`);
const titles = (page, status) => column(page, status).locator('.card-title-text');
const cardByTitle = (page, title) => page.getByRole('article', { name: title, exact: true });
const sampleCard = (id, title = id) => ({ id, title, description: '' });
const boardWith = (columns = {}) => ({ version: 1, columns: { todo: [], 'in-progress': [], done: [], ...columns } });

async function openBoard(page, saved) {
  if (saved !== undefined) {
    const state = backend(page);
    state.rows.set(users.a.id, { user_id: users.a.id, board: typeof saved === 'string' ? JSON.parse(saved) : saved, version: 1 });
  }
  await page.goto('/');
  await expect(page.getByRole('button', { name: '카드 추가', exact: true })).toBeEnabled();
}
async function addCard(page, title, description = '') {
  await page.getByRole('button', { name: '카드 추가', exact: true }).click();
  await page.getByLabel('제목 (필수)', { exact: true }).fill(title);
  await page.getByLabel('설명 (선택)', { exact: true }).fill(description);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function stored(page) { const state = backend(page);const row = state.rows.get(users[state.active || 'a'].id);return row ? JSON.stringify(row.board) : null; }

async function dispatchTouch(session, type, x, y) {
  await session.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : [{ x, y }],
  });
}
async function scrollPage(page, isMobile) {
  if (!isMobile) { await page.mouse.wheel(0, 350); return; }
  const session = await page.context().newCDPSession(page);
  await dispatchTouch(session, 'touchStart', 200, 600);
  for (let step = 1; step <= 12; step++) await dispatchTouch(session, 'touchMove', 200, 600 - step * 25);
  await dispatchTouch(session, 'touchEnd');
  await session.detach();
}

// 같은 helper로 마우스 또는 실제 Chromium touch 입력을 보냅니다.
async function startDrag(page, handle, isMobile) {
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const session = isMobile ? await page.context().newCDPSession(page) : null;
  async function touch(type, x, y) {
    await dispatchTouch(session, type, x, y);
  }
  if (session) await touch('touchStart', point.x, point.y);
  else { await page.mouse.move(point.x, point.y); await page.mouse.down(); }
  return {
    point,
    async move(x, y) {
      if (session) await touch('touchMove', x, y);
      else await page.mouse.move(x, y, { steps: 4 });
    },
    async end() {
      if (session) { await touch('touchEnd'); await session.detach(); }
      else await page.mouse.up();
    },
    async cancel() {
      if (session) { await touch('touchCancel'); await session.detach(); }
      else {
        // 마우스 취소는 실제 드래그 포인터 ID를 대상으로 취소를 통지합니다.
        await page.locator('.drag-handle').evaluateAll(handles => {
          const source = handles.find(h => h.closest('.is-dragging'));
          if (source) source.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 1 }));
        });
        await page.mouse.up();
      }
    },
  };
}
async function dragTo(page, handle, target, isMobile, placement = 'column') {
  const drag = await startDrag(page, handle, isMobile);
  await drag.move(drag.point.x + 10, drag.point.y + 10);
  await expect(page.locator('.drag-ghost')).toBeVisible();
  const height = page.viewportSize().height;
  function targetPoint(box) {
    return { x: box.x + box.width / 2, y: placement === 'after' ? box.y + box.height - 8 : placement === 'before' ? box.y + 8 : box.y + 80 };
  }
  // 세로 모바일 컬럼이 화면 밖이면 실제 드래그 자동 스크롤로 도달합니다.
  await expect.poll(async () => {
    const box = await target.boundingBox();
    const point = targetPoint(box);
    if (point.y < 64 || point.y > height - 64) {
      await drag.move(Math.min(Math.max(point.x, 16), page.viewportSize().width - 16), point.y < 64 ? 12 : height - 12);
      return false;
    }
    return true;
  }, { timeout: 12_000, intervals: [50, 100, 150] }).toBe(true);
  const point = targetPoint(await target.boundingBox());
  await drag.move(point.x, point.y);
  await expect(page.locator('.drop-indicator')).toBeVisible();
  await drag.end();
  await expect(page.locator('.drag-ghost')).toHaveCount(0);
}
module.exports = { test, expect, KEY, STATUSES, column, titles, cardByTitle, sampleCard, boardWith, openBoard, addCard, stored, startDrag, dragTo, scrollPage, backend, users };
