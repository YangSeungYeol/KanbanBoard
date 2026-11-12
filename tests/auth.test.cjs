const { createAuthService, validateCredentials, authMessage } = require('../auth.js');
const confirmed = { user: { id: 'a', email: 'a@example.com', email_confirmed_at: '2026-01-01' }, access_token: 'token' };
function setup() {
  const auth = {
    signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'a' }, session: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { session: confirmed }, error: null }),
    signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: 'https://provider.example/' }, error: null }),
    resend: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };
  return { auth, service: createAuthService({ auth }, 'http://localhost:8000/') };
}
test.each(['', 'bad', 'a b@example.com'])('잘못된 이메일 %j 거부', email => expect(() => validateCredentials(email, '12345678', '12345678', true)).toThrow());
test('가입 비밀번호 길이·확인 일치 검사, 로그인은 기존 짧은 암호 허용', () => {
  expect(() => validateCredentials('a@example.com', 'short', 'short', true)).toThrow();
  expect(() => validateCredentials('a@example.com', '12345678', 'different', true)).toThrow();
  expect(validateCredentials(' a@example.com ', 'old6', '', false).email).toBe('a@example.com');
});
test('이메일 가입은 인증 복귀 주소 전달·인증 대기', async () => {
  const { auth, service } = setup();
  const result = await service.signup('a@example.com', '12345678', '12345678');
  expect(auth.signUp).toHaveBeenCalledWith({ email: 'a@example.com', password: '12345678', options: { emailRedirectTo: 'http://localhost:8000/' } });
  expect(result.pending).toBe(true);
});
test('미인증 세션 로그인은 거부', async () => {
  const { auth, service } = setup();
  auth.signInWithPassword.mockResolvedValue({ data: { session: { user: { id: 'a' } } }, error: null });
  await expect(service.login('a@example.com', '12345678')).rejects.toThrow('인증');
});
test('인증한 이메일 로그인 세션 반환', async () => {
  const { service } = setup(); expect(await service.login('a@example.com', '12345678')).toEqual(confirmed);
});
test.each(['google', 'github'])('%s OAuth PKCE SDK에 계정 선택과 앱 복귀 전달', async provider => {
  const { auth, service } = setup(); await service.oauth(provider);
  expect(auth.signInWithOAuth).toHaveBeenCalledWith({ provider, options: { redirectTo: 'http://localhost:8000/', queryParams: { prompt: 'select_account' } } });
});
test('지원하지 않는 OAuth와 비HTTP 복귀 거부', async () => {
  const { service } = setup(); await expect(service.oauth('unknown')).rejects.toThrow();
  expect(() => createAuthService({ auth: {} }, 'javascript:alert(1)')).toThrow();
});
test('인증메일 재발송·현재 브라우저 로그아웃', async () => {
  const { auth, service } = setup(); await service.resend('a@example.com');await service.signout();
  expect(auth.resend).toHaveBeenCalledWith({ type: 'signup', email: 'a@example.com', options: { emailRedirectTo: 'http://localhost:8000/' } });
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
});
test('중복 가입 제출 차단·오류 후 재시도 가능', async () => {
  const { auth, service } = setup(); let resolve;
  auth.signUp.mockReturnValueOnce(new Promise(r => { resolve = r; }));
  const first = service.signup('a@example.com', '12345678', '12345678');
  await expect(service.signup('a@example.com', '12345678', '12345678')).rejects.toThrow('진행');
  resolve({ data: {}, error: { code: 'over_email_send_rate_limit' } });
  await expect(first).rejects.toThrow();
  await expect(service.signup('a@example.com', '12345678', '12345678')).resolves.toHaveProperty('pending', true);
});
test('오류 문구에 원격 메시지나 토큰을 노출하지 않음', () => {
  expect(authMessage({ code: 'email_not_confirmed' })).toContain('인증');
  expect(authMessage({ message: '<secret-token>' })).not.toContain('secret-token');
});
