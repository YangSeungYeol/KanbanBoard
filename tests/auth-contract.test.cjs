const fs = require('node:fs');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');

beforeEach(() => { document.documentElement.innerHTML = html.replace(/<!doctype html>/i, ''); });
test('비로그인 화면은 Google·GitHub·이메일 가입/로그인과 보드 접근 차단을 제공한다', () => {
  expect(document.getElementById('auth-panel')).not.toBeNull();
  expect(document.getElementById('google-login').textContent).toContain('Google');
  expect(document.getElementById('github-login').textContent).toContain('GitHub');
  expect(document.getElementById('auth-email').type).toBe('email');
  expect(document.getElementById('auth-password').type).toBe('password');
  expect(document.getElementById('signup-mode')).not.toBeNull();
  expect(document.getElementById('board-workspace').hidden).toBe(true);
});
