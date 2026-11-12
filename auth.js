(function () {
  'use strict';
  function validateEmail(email) {
    const address = String(email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('올바른 이메일 주소를 입력해주세요.');
    return address;
  }
  function validateCredentials(email, password, confirmation, signup = false) {
    const address = validateEmail(email);
    if (typeof password !== 'string' || !password || (signup && password.length < 8)) throw new Error(signup ? '비밀번호는 8자 이상 입력해주세요.' : '비밀번호를 입력해주세요.');
    if (signup && password !== confirmation) throw new Error('비밀번호 확인이 일치하지 않습니다.');
    return { email: address, password };
  }
  function authMessage(error) {
    const messages = {
      email_not_confirmed: '이메일 인증이 필요합니다. 받은 메일의 확인 링크를 열어주세요.',
      invalid_credentials: '이메일 또는 비밀번호를 확인해주세요.',
      over_email_send_rate_limit: '메일 요청이 많습니다. 잠시 후 다시 시도해주세요.',
      over_request_rate_limit: '요청이 많습니다. 잠시 후 다시 시도해주세요.',
      user_already_exists: '가입을 진행할 수 없습니다. 기존 계정으로 로그인해주세요.',
      signup_disabled: '현재 회원가입이 허용되지 않습니다. 관리자 설정을 확인해주세요.',
      provider_disabled: '선택한 로그인 제공자가 아직 활성화되지 않았습니다.',
      weak_password: '비밀번호가 서버 보안 규칙에 맞지 않습니다. 더 긴 비밀번호를 사용해주세요.',
    };
    return messages[error?.code] || '인증 요청을 처리하지 못했습니다. 연결 상태와 인증 설정을 확인해주세요.';
  }
  function isConfirmed(session) { return !!(session?.access_token && session?.user?.id && session.user.email_confirmed_at); }
  function createAuthService(client, redirectUrl) {
    const url = new URL(redirectUrl);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('HTTP 주소에서 실행해주세요.');
    url.search = ''; url.hash = '';
    const redirectTo = url.href;
    let busy = false;
    async function run(operation) {
      if (busy) throw new Error('인증 요청이 진행 중입니다.');
      busy = true;
      try {
        const result = await operation();
        if (result.error) throw new Error(authMessage(result.error));
        return result.data;
      } finally { busy = false; }
    }
    return {
      async signup(email, password, confirmation) {
        const input = validateCredentials(email, password, confirmation, true);
        const data = await run(() => client.auth.signUp({ ...input, options: { emailRedirectTo: redirectTo } }));
        if (data?.session && !isConfirmed(data.session)) await client.auth.signOut({ scope: 'local' });
        return { pending: !isConfirmed(data?.session), session: isConfirmed(data?.session) ? data.session : null };
      },
      async login(email, password) {
        const input = validateCredentials(email, password, '', false);
        const data = await run(() => client.auth.signInWithPassword(input));
        if (!isConfirmed(data?.session)) {
          await client.auth.signOut({ scope: 'local' });
          throw new Error('이메일 인증이 필요합니다. 받은 메일의 확인 링크를 열어주세요.');
        }
        return data.session;
      },
      async oauth(provider) {
        if (!['google', 'github'].includes(provider)) throw new Error('지원하지 않는 로그인 방식입니다.');
        return run(() => client.auth.signInWithOAuth({ provider, options: { redirectTo, queryParams: { prompt: 'select_account' } } }));
      },
      async resend(email) {
        const address = validateEmail(email);
        return run(() => client.auth.resend({ type: 'signup', email: address, options: { emailRedirectTo: redirectTo } }));
      },
      async signout() { return run(() => client.auth.signOut({ scope: 'local' })); },
    };
  }
  const api = { validateCredentials, authMessage, isConfirmed, createAuthService };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.KanbanAuth = api;
})();
