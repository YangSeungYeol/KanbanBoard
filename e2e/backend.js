// 테스트에서만 외부 Auth/PostgREST 응답을 대체합니다. 제품 코드에 테스트 로그인은 없습니다.
const KEY = 'kanban-auth:v1';
const SUPABASE_URL = 'https://jmteohphohvjokpthusa.supabase.co';
const users = {
  a: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'a@example.com', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z' },
  b: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', email: 'b@example.com', email_confirmed_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z' },
};
function sessionFor(name = 'a') {
  const user = users[name]; const exp = Math.floor(Date.now() / 1000) + 3600;
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, role: 'authenticated', exp, iss: SUPABASE_URL + '/auth/v1' })}.test-signature`;
  return { access_token, refresh_token: `refresh-${name}`, token_type: 'bearer', expires_in: 3600, expires_at: exp, user };
}
const states = new WeakMap();
async function installBackend(page, { signedIn = true } = {}) {
  const state = { rows: new Map(), active: signedIn ? 'a' : null, writes: [], oauth: [], confirmed: true, failSave: null, failLoad: null, holdSave: null };
  states.set(page, state);
  if (signedIn) await page.addInitScript(({ key, session }) => {
    if (!sessionStorage.getItem('e2e-auth-seeded')) {
      localStorage.setItem(key, JSON.stringify(session));sessionStorage.setItem('e2e-auth-seeded', '1');
    }
  }, { key: KEY, session: sessionFor('a') });
  await page.route(SUPABASE_URL + '/**', async route => {
    const request = route.request(), url = new URL(request.url());
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: { 'access-control-allow-origin': '*' } });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.pathname.endsWith('/signup')) return json({ user: { ...users.a, email_confirmed_at: null }, session: null });
    if (url.pathname.endsWith('/resend')) return json({});
    if (url.pathname.endsWith('/logout')) { state.active = null; return json({}); }
    if (url.pathname.endsWith('/token')) {
      const input = request.postDataJSON();
      if (input.password === 'wrong') return json({ code: 'invalid_credentials', msg: 'Invalid credentials' }, 400);
      if (!state.confirmed) return json({ code: 'email_not_confirmed', msg: 'Email not confirmed' }, 400);
      state.active = input.email === users.b.email ? 'b' : 'a';return json(sessionFor(state.active));
    }
    if (url.pathname.endsWith('/user')) return json(users[state.active || 'a']);
    if (url.pathname.endsWith('/authorize')) {
      state.oauth.push(url.searchParams.get('provider'));
      return route.fulfill({ contentType: 'text/html', body: '<h1>OAuth provider</h1>' });
    }
    let owner = null;
    const authorization = request.headers().authorization || '';
    try { owner = JSON.parse(Buffer.from(authorization.split(' ')[1].split('.')[1], 'base64url').toString()).sub; } catch (_) { /* anon */ }
    if (!owner) return json({ code: '42501', message: 'AUTH_REQUIRED' }, 401);
    if (url.pathname.endsWith('/kanban_boards')) {
      if (state.failLoad) return json({ code: state.failLoad, message: 'Load failed' }, 400);
      const row = state.rows.get(owner);
      // maybeSingle의 표준 배열 응답을 사용합니다.
      return json(row ? [row] : []);
    }
    if (url.pathname.endsWith('/rpc/save_kanban_board')) {
      const payload = request.postDataJSON();
      if (state.holdSave) await state.holdSave;
      if (state.failSave) return json({ code: 'P0001', message: state.failSave }, 400);
      const current = state.rows.get(owner);
      if ((current?.version || 0) !== payload.p_expected_version) return json({ code: 'P0001', message: 'VERSION_CONFLICT' }, 400);
      const row = { user_id: owner, board: payload.p_board, version: (current?.version || 0) + 1 };
      state.rows.set(owner, row);state.writes.push({ owner, ...payload });return json([row]);
    }
    return json({ message: 'Unexpected test API request' }, 404);
  });
  return state;
}
const backend = page => states.get(page);
module.exports = { installBackend, backend, sessionFor, users, KEY, SUPABASE_URL };
