(function () {
  'use strict';
  async function start(doc, dependencies = {}) {
    const win = doc.defaultView;
    const $ = id => doc.getElementById(id);
    const Model = dependencies.model || win.KanbanBoard;
    const Auth = dependencies.auth || win.KanbanAuth;
    const Cloud = dependencies.cloud || win.KanbanCloud;
    const config = dependencies.config || win.KANBAN_CONFIG;
    let client, service, store, app = null, userId = null, generation = 0, signup = false, submitting = false;
    const status = text => { $('auth-status').textContent = text; };
    const error = text => { $('auth-error').textContent = text; $('auth-error').hidden = !text; };
    function clearBoard() {
      if (app) app.destroy(); app = null;
      $('board-workspace').hidden = true; $('add-card').hidden = true; $('add-card').disabled = true;
      $('board').querySelectorAll('.card-list').forEach(list => list.replaceChildren());
      $('board').querySelectorAll('.count').forEach(node => { node.textContent = '0'; });
      $('legacy-panel').hidden = true;
    }
    function authBusy(value) {
      submitting = value;
      doc.querySelectorAll('#auth-panel button,#auth-panel input').forEach(el => { el.disabled = value; });
      $('signout').disabled = value;
    }
    function legacyAvailable(board) {
      if (Object.values(board.columns).some(cards => cards.length)) return false;
      try {
        const raw = win.localStorage.getItem(Model.KEY);
        return raw && Object.values(Model.validateBoard(JSON.parse(raw)).columns).some(cards => cards.length);
      } catch (_) { return false; }
    }
    function showBoard(board) {
      app = Model.createApp(doc, {
        initialBoard: board,
        save: next => store.save(next),
        errorMessage: Cloud.message,
        onError: err => error(Cloud.message(err)),
        onBusy: value => { $('refresh-board').disabled = value; $('import-legacy').disabled = value; },
      });
      if (!app) { status('화면 라이브러리를 불러오지 못했습니다.'); return; }
      $('legacy-panel').hidden = !legacyAvailable(board);
    }
    async function refresh() {
      if (!userId) return;
      const ticket = generation;
      clearBoard(); error(''); status('보드를 불러오고 있습니다…'); $('refresh-board').disabled = true;
      try {
        const snapshot = await store.load();
        if (ticket !== generation) return;
        showBoard(snapshot.board); status('계정별 클라우드 저장을 사용하고 있습니다.');
      } catch (err) {
        if (ticket === generation) { error(Cloud.message(err)); status('보드를 불러오지 못했습니다. 서버 설정과 연결을 확인해주세요.'); }
      } finally { if (ticket === generation) $('refresh-board').disabled = false; }
    }
    async function sessionChanged(session) {
      const verified = Auth.isConfirmed(session);
      const nextId = verified ? session.user.id : null;
      if (nextId && nextId === userId) return;
      generation++; clearBoard(); userId = nextId; store.setUser(verified ? session.user : null);
      $('account-menu').hidden = !verified; $('auth-panel').hidden = verified;
      error('');
      if (!verified) {
        $('account-label').textContent = '';
        status(session ? '이메일 인증 후 로그인해주세요.' : '로그인하여 나의 칸반보드를 여세요.');
        return;
      }
      $('auth-password').value = ''; $('auth-confirm').value = '';
      $('account-label').textContent = session.user.email || '로그인한 계정';
      await refresh();
    }
    try {
      if (!config?.supabaseUrl?.startsWith('https://') || !config?.supabasePublishableKey?.startsWith('sb_publishable_') || !win.supabase?.createClient && !dependencies.client) throw new Error('CONFIG');
      client = dependencies.client || win.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'kanban-auth:v1' },
      });
      service = Auth.createAuthService(client, win.location.href);
      store = Cloud.createCloudStore(client, { validateBoard: Model.validateBoard, emptyBoard: Model.emptyBoard });
    } catch (_) { error('인증 설정을 불러오지 못했습니다. 인터넷 연결과 config.js 설정을 확인해주세요.'); status('인증 준비가 필요합니다.'); return null; }
    function mode(next) {
      signup = next; error('');
      $('signup-mode').setAttribute('aria-pressed', String(signup)); $('login-mode').setAttribute('aria-pressed', String(!signup));
      $('confirm-field').hidden = !signup; $('auth-submit').textContent = signup ? '인증 메일 받고 가입' : '로그인';
      $('auth-heading').textContent = signup ? '회원가입' : '로그인';
      $('auth-password').autocomplete = signup ? 'new-password' : 'current-password';
      $('auth-password').value = ''; $('auth-confirm').value = '';
    }
    async function request(operation) {
      if (submitting) return;
      authBusy(true); error('');
      try { await operation(); }
      catch (err) { error(err.message || '인증 요청을 처리하지 못했습니다.'); }
      finally { $('auth-password').value = ''; $('auth-confirm').value = ''; authBusy(false); }
    }
    $('login-mode').addEventListener('click', () => mode(false));
    $('signup-mode').addEventListener('click', () => mode(true));
    $('auth-form').addEventListener('submit', event => {
      event.preventDefault(); request(async () => {
        if (signup) {
          const result = await service.signup($('auth-email').value, $('auth-password').value, $('auth-confirm').value);
          if (result.session) await sessionChanged(result.session);
          else { status('가입 확인 메일을 보냈습니다. 같은 브라우저에서 메일 링크를 확인한 후 로그인해주세요.'); $('resend-email').hidden = false; }
        } else await sessionChanged(await service.login($('auth-email').value, $('auth-password').value));
      });
    });
    for (const provider of ['google', 'github']) $(provider + '-login').addEventListener('click', () => request(() => service.oauth(provider)));
    $('resend-email').addEventListener('click', () => request(async () => { await service.resend($('auth-email').value); status('인증 메일을 다시 요청했습니다. 메일함을 확인해주세요.'); }));
    $('signout').addEventListener('click', () => request(async () => { await service.signout(); await sessionChanged(null); }));
    $('refresh-board').addEventListener('click', refresh);
    $('import-legacy').addEventListener('click', async () => {
      if (!app || !legacyAvailable(app.getState())) return;
      if (!win.confirm('이 브라우저의 이전 보드를 현재 로그인 계정으로 가져올까요? 원본은 보존됩니다.')) return;
      const ticket = generation;
      $('import-legacy').disabled = true;
      try {
        const legacy = Model.validateBoard(JSON.parse(win.localStorage.getItem(Model.KEY)));
        clearBoard(); $('refresh-board').disabled = true;
        const snapshot = await store.save(legacy);
        if (ticket !== generation) return;
        clearBoard(); showBoard(snapshot.board); status('이전 보드를 계정에 가져왔습니다. 브라우저 원본은 보존했습니다.');
      } catch (err) { if (ticket === generation) error(Cloud.message(err)); }
      finally { if (ticket === generation) { $('import-legacy').disabled = false; $('refresh-board').disabled = false; } }
    });
    client.auth.onAuthStateChange((_event, session) => { queueMicrotask(() => { sessionChanged(session).catch(() => error('세션을 처리하지 못했습니다. 다시 로그인해주세요.')); }); });
    authBusy(false);
    try {
      const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      await sessionChanged(data.session);
      if (new URL(win.location.href).searchParams.has('error')) error('외부 로그인이 취소되었거나 인증 링크가 유효하지 않습니다. 다시 시도해주세요.');
    } catch (_) { await sessionChanged(null); error('로그인 복귀 정보를 확인하지 못했습니다. 다시 로그인해주세요.'); }
    return { refresh, sessionChanged, getStore: () => store };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { start };
  else document.addEventListener('DOMContentLoaded', () => { start(document).catch(() => { const error = document.getElementById('auth-error'); error.hidden = false; error.textContent = '앱을 초기화하지 못했습니다. 새로고침해주세요.'; }); }, { once: true });
})();
