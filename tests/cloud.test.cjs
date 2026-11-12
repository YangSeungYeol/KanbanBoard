const { createCloudStore } = require('../cloud.js');
const { emptyBoard, validateBoard } = require('../script.js');
const sample = () => ({ version: 1, columns: { todo: [{ id: 'one', title: '할 일', description: '' }], 'in-progress': [], done: [] } });
function setup(options = {}) {
  const read = jest.fn().mockResolvedValue({ data: null, error: null });
  const query = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: read };
  const client = { from: jest.fn(() => query), rpc: jest.fn() };
  const store = createCloudStore(client, { emptyBoard, validateBoard, ...options });
  store.setUser({ id: 'a' });
  return { store, client, query, read };
}
test('최초 서버 보드는 비어 있고 소유자 필터로 조회', async () => {
  const { store, client, query } = setup(); expect((await store.load()).board).toEqual(emptyBoard());
  expect(client.from).toHaveBeenCalledWith('kanban_boards');expect(query.eq).toHaveBeenCalledWith('user_id', 'a');
});
test('저장은 전용 RPC에 버전0 전달하고 서버 확정 데이터 반환', async () => {
  const { store, client } = setup();await store.load();
  client.rpc.mockResolvedValue({ data: [{ user_id: 'a', board: sample(), version: 1 }], error: null });
  expect((await store.save(sample())).version).toBe(1);
  expect(client.rpc).toHaveBeenCalledWith('save_kanban_board', { p_board: sample(), p_expected_version: 0 });
});
test('기존 버전을 다음 저장의 충돌 검사에 사용', async () => {
  const { store, client, read } = setup();read.mockResolvedValue({ data: { user_id: 'a', board: sample(), version: 7 }, error: null });await store.load();
  client.rpc.mockResolvedValue({ data: [{ user_id: 'a', board: emptyBoard(), version: 8 }], error: null });await store.save(emptyBoard());
  expect(client.rpc.mock.calls[0][1].p_expected_version).toBe(7);
});
test.each(['VERSION_CONFLICT', 'network'])('%s 실패 시 원본 유지·재조회 전 저장 차단', async message => {
  const { store, client } = setup();await store.load();client.rpc.mockResolvedValue({ error: { message } });
  await expect(store.save(sample())).rejects.toThrow();expect(store.snapshot().board).toEqual(emptyBoard());
  await expect(store.save(sample())).rejects.toThrow();expect(client.rpc).toHaveBeenCalledTimes(1);
  await store.load();expect(store.snapshot().needsRefresh).toBe(false);
});
test('다른 사용자 서버 응답 거부', async () => {
  const { store, read } = setup();read.mockResolvedValue({ data: { user_id: 'b', board: sample(), version: 1 } });
  await expect(store.load()).rejects.toThrow();expect(store.snapshot().loaded).toBe(false);
});
test('로그아웃 후 늦은 조회 응답이 보드를 되살리지 않음', async () => {
  const { store, read } = setup();let resolve;read.mockReturnValue(new Promise(r => { resolve = r; }));
  const pending = store.load();store.setUser(null);resolve({ data: { user_id: 'a', board: sample(), version: 1 } });
  await expect(pending).rejects.toThrow('STALE_SESSION');expect(store.snapshot().user).toBeNull();expect(store.snapshot().board).toEqual(emptyBoard());
});
test('세션 변경 후 늦은 저장 응답 무시', async () => {
  const { store, client } = setup();await store.load();let resolve;client.rpc.mockReturnValue(new Promise(r => { resolve = r; }));
  const pending = store.save(sample());store.setUser({ id: 'b' });resolve({ data: [{ user_id: 'a', board: sample(), version: 1 }] });
  await expect(pending).rejects.toThrow('STALE_SESSION');expect(store.snapshot().user.id).toBe('b');expect(store.snapshot().loaded).toBe(false);
});
test('비로그인·미조회 상태 저장 거부', async () => {
  const { store } = setup();await expect(store.save(sample())).rejects.toThrow();store.setUser(null);await expect(store.load()).rejects.toThrow();
});
test('시간 초과는 변경 성공으로 처리하지 않음', async () => {
  jest.useFakeTimers();const { store, read } = setup({ timeoutMs: 20 });read.mockReturnValue(new Promise(() => {}));
  const request = store.load();const assertion = expect(request).rejects.toThrow();await jest.advanceTimersByTimeAsync(25);await assertion;
  expect(store.snapshot().needsRefresh).toBe(true);jest.useRealTimers();
});
