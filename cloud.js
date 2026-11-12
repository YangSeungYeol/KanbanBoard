(function () {
  'use strict';
  const requestError = error => Object.assign(new Error(error.message || 'REQUEST_FAILED'), { code: error.code });
  function createCloudStore(client, { validateBoard, emptyBoard, timeoutMs = 15000 }) {
    let user = null, board = emptyBoard(), version = 0, loaded = false, busy = false, needsRefresh = false, epoch = 0;
    const snapshot = () => ({ user: user ? { ...user } : null, board: validateBoard(board), version, loaded, busy, needsRefresh });
    function current(generation) { if (generation !== epoch) throw new Error('STALE_SESSION'); }
    async function bounded(request) {
      let timer;
      try { return await Promise.race([request, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeoutMs); })]); }
      finally { clearTimeout(timer); }
    }
    function accept(row, generation) {
      current(generation);
      if (!row || row.user_id !== user.id || !Number.isSafeInteger(row.version) || row.version < 1) throw new Error('INVALID_OWNER_RESPONSE');
      const next = validateBoard(row.board);
      board = next; version = row.version; loaded = true; needsRefresh = false;
      return snapshot();
    }
    return {
      snapshot,
      setUser(next) {
        if (next?.id && next.id === user?.id) return false;
        epoch++; user = next ? { id: next.id } : null; board = emptyBoard(); version = 0;
        loaded = busy = needsRefresh = false; return true;
      },
      async load() {
        if (!user || busy) throw new Error('NOT_READY');
        const generation = epoch; busy = true;
        try {
          const { data, error } = await bounded(client.from('kanban_boards').select('user_id,board,version').eq('user_id', user.id).maybeSingle());
          current(generation); if (error) throw requestError(error);
          if (data) accept(data, generation);
          else { board = emptyBoard(); version = 0; loaded = true; needsRefresh = false; }
          return snapshot();
        } catch (error) { current(generation); needsRefresh = true; throw error; }
        finally { if (generation === epoch) busy = false; }
      },
      async save(next) {
        if (!user || !loaded || busy || needsRefresh) throw new Error('NOT_READY');
        const validated = validateBoard(next), generation = epoch, expected = version;
        busy = true;
        try {
          const { data, error } = await bounded(client.rpc('save_kanban_board', { p_board: validated, p_expected_version: expected }));
          current(generation); if (error) throw requestError(error);
          if (!Array.isArray(data) || data.length !== 1 || data[0].version <= expected) throw new Error('INVALID_BOARD_RESPONSE');
          return accept(data[0], generation);
        } catch (error) { current(generation); needsRefresh = true; throw error; }
        finally { if (generation === epoch) busy = false; }
      },
    };
  }
  function message(error) {
    if (/VERSION_CONFLICT/.test(error?.message || '')) return '다른 곳에서 보드가 바뀌었습니다. 서버에서 다시 불러온 뒤 수정해주세요.';
    if (/42P01|PGRST20[25]/.test(error?.code || '')) return '칸반 저장소가 준비되지 않았습니다. AUTH_SETUP.md의 SQL 설정을 확인해주세요.';
    return '서버 요청을 확인하지 못했습니다. 변경이 반영되었을 수 있으니 서버에서 다시 불러와주세요.';
  }
  const api = { createCloudStore, message };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.KanbanCloud = api;
})();
