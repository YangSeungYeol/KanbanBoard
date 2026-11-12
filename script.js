/* 칸반보드: 빌드 없는 브라우저 앱, CommonJS 내보내기는 Jest용입니다. */
(function () {
  'use strict';
  const KEY = 'kanban-board:v1';
  const STATUSES = ['todo', 'in-progress', 'done'];
  const LABELS = { todo: 'To-Do', 'in-progress': 'In-Progress', done: 'Done' };
  const emptyBoard = () => ({ version: 1, columns: { todo: [], 'in-progress': [], done: [] } });
  function validateBoard(value) {
    if (!value || value.version !== 1 || !value.columns) throw new Error('지원하지 않는 저장 형식');
    const board = emptyBoard();
    const ids = new Set();
    for (const status of STATUSES) {
      if (!Array.isArray(value.columns[status])) throw new Error('컬럼 형식 오류');
      board.columns[status] = value.columns[status].map(card => {
        if (!card || typeof card.id !== 'string' || !card.id.trim() || ids.has(card.id) ||
            typeof card.title !== 'string' || !card.title.trim() || typeof card.description !== 'string') {
          throw new Error('카드 형식 오류');
        }
        ids.add(card.id);
        return { id: card.id, title: card.title.trim(), description: card.description };
      });
    }
    return board;
  }
  function readBoard(storage) {
    try {
      const raw = storage.getItem(KEY);
      return { board: raw === null ? emptyBoard() : validateBoard(JSON.parse(raw)), error: '' };
    } catch (_) {
      return { board: emptyBoard(), error: '저장된 보드를 복원하지 못했습니다. 빈 보드로 시작합니다. 새 변경사항을 저장하면 기존 저장 내용을 대체합니다.' };
    }
  }
  function writeBoard(storage, board) {
    try { storage.setItem(KEY, JSON.stringify(board)); return ''; }
    catch (_) { return '브라우저에 저장하지 못했습니다. 새로고침하면 변경사항이 사라질 수 있습니다.'; }
  }
  function locate(board, id) {
    for (const status of STATUSES) {
      const index = board.columns[status].findIndex(card => card.id === id);
      if (index !== -1) return { status, index, card: board.columns[status][index] };
    }
    return null;
  }
  function reduceBoard(board, action) {
    const next = validateBoard(board);
    const found = locate(next, action.id);
    if (action.type === 'add' || action.type === 'edit') {
      if (typeof action.title !== 'string' || !action.title.trim() || typeof action.description !== 'string') return board;
      if (action.type === 'add') {
        if (found || typeof action.id !== 'string' || !action.id.trim()) return board;
        next.columns.todo.push({ id: action.id, title: action.title.trim(), description: action.description });
      } else {
        if (!found) return board;
        Object.assign(found.card, { title: action.title.trim(), description: action.description });
      }
    } else if (action.type === 'delete') {
      if (!found) return board;
      next.columns[found.status].splice(found.index, 1);
    } else if (action.type === 'move') {
      if (!found || !STATUSES.includes(action.status) || !Number.isInteger(action.index)) return board;
      const length = next.columns[action.status].length - (action.status === found.status ? 1 : 0);
      if (action.index < 0 || action.index > length || (found.status === action.status && found.index === action.index)) return board;
      next.columns[found.status].splice(found.index, 1);
      next.columns[action.status].splice(action.index, 0, found.card);
    } else return board;
    return next;
  }
  function createApp(doc, options = {}) {
    const win = doc.defaultView;
    const M = options.materialize || win.M;
    const errorBox = doc.getElementById('load-error');
    if (!M || !M.Modal) {
      errorBox.textContent = 'UI 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해주세요.';
      errorBox.hidden = false;
      return null;
    }
    let storage;
    try { storage = options.storage || win.localStorage; } catch (_) { storage = null; }
    const loaded = options.initialBoard ? { board: validateBoard(options.initialBoard), error: '' } : readBoard(storage);
    let board = loaded.board;
    const root = doc.getElementById('board');
    const warning = doc.getElementById('storage-warning');
    const addButton = doc.getElementById('add-card');
    const form = doc.getElementById('card-form');
    const title = doc.getElementById('card-title');
    const description = doc.getElementById('card-description');
    const titleError = doc.getElementById('title-error');
    let editing = null, deleting = null, returnFocus = null, activeModal = null;
    let saving = false, blocked = false, destroyed = false;
    const listeners = [];
    function on(target, type, handler) { target.addEventListener(type, handler); listeners.push(() => target.removeEventListener(type, handler)); }
    function showWarning(message) { warning.textContent = message; warning.hidden = !message; }
    function announce(message) { doc.getElementById('announcement').textContent = message; }
    function element(tag, className, text) {
      const el = doc.createElement(tag);
      if (className) el.className = className;
      if (text !== undefined) el.textContent = text;
      return el;
    }
    function focusCard(id, action = 'move') {
      const card = [...root.querySelectorAll('[data-card-id]')].find(node => node.dataset.cardId === id);
      const target = card && card.querySelector(action === 'move' ? 'select' : `[data-action="${action}"]`);
      if (target) target.focus();
    }
    function render() {
      for (const status of STATUSES) {
        const column = root.querySelector(`[data-status="${status}"]`);
        const list = column.querySelector('.card-list');
        list.replaceChildren();
        column.querySelector('.count').textContent = String(board.columns[status].length);
        if (!board.columns[status].length) list.append(element('p', 'empty-state', '카드를 추가하거나 이곳으로 이동하세요'));
        for (const card of board.columns[status]) {
          const article = element('article', 'kanban-card card');
          article.dataset.cardId = card.id;
          const headingId = `title-${card.id}`;
          article.setAttribute('aria-labelledby', headingId);
          const top = element('div', 'card-top');
          const controls = element('div', 'card-controls');
          for (const [action, text, label] of [['drag', '⠿', '드래그 핸들'], ['edit', '수정', '수정'], ['delete', '삭제', '삭제']]) {
            const button = element('button', action === 'drag' ? 'icon-button drag-handle' : 'icon-button', text);
            button.type = 'button'; button.dataset.action = action;
            button.setAttribute('aria-label', `${card.title} ${label}`);
            if (action === 'drag') top.append(button); else controls.append(button);
          }
          top.append(controls);
          const heading = element('h3', 'card-title-text', card.title); heading.id = headingId;
          article.append(top, heading);
          if (card.description) article.append(element('p', 'card-description', card.description));
          const footer = element('div', 'status-control');
          const label = element('label', '', '상태'); label.htmlFor = `status-${card.id}`;
          const select = element('select', 'status-select browser-default'); select.id = label.htmlFor;
          select.setAttribute('aria-label', `${card.title} 상태`);
          for (const s of STATUSES) { const opt = element('option', '', LABELS[s]); opt.value = s; select.append(opt); }
          select.value = status;
          footer.append(label, select); article.append(footer); list.append(article);
        }
      }
    }
    function setSaving(value) {
      saving = value; root.inert = value; addButton.disabled = value;
      doc.querySelectorAll('#card-form input,#card-form textarea,#card-form button,#delete-modal button').forEach(el => { el.disabled = value; });
      if (options.onBusy) options.onBusy(value);
    }
    function commit(action, message, after) {
      if (saving || blocked || destroyed) return false;
      const next = reduceBoard(board, action);
      if (next === board) return false;
      function apply(confirmed) {
        if (destroyed) return;
        board = validateBoard(confirmed); render();
        if (message) announce(message);
        if (after) after();
      }
      if (!options.save) { showWarning(writeBoard(storage, next)); apply(next); return true; }
      setSaving(true);
      Promise.resolve().then(() => options.save(next)).then(result => {
        if (destroyed) return;
        setSaving(false); showWarning(''); apply(result.board);
      }).catch(error => {
        if (destroyed) return;
        setSaving(false); blocked = true; root.inert = true; addButton.disabled = true; render();
        doc.querySelector('#card-form [type="submit"]').disabled = true;
        const message = options.errorMessage ? options.errorMessage(error) : '저장하지 못했습니다. 서버에서 다시 불러와주세요.';
        showWarning(message); if (options.onError) options.onError(error);
      });
      return true;
    }
    const modalElements = [doc.getElementById('card-modal'), doc.getElementById('delete-modal')];
    function restoreFocus() {
      if (returnFocus && returnFocus.isConnected) returnFocus.focus(); else addButton.focus();
    }
    function closeModal() {
      if (activeModal === null || saving) return;
      const el = modalElements[activeModal];
      activeModal = null; el.close(); restoreFocus();
    }
    // Materialize 2.2.2의 modal 스타일은 네이티브 dialog에도 적용됩니다.
    function openModal(index, trigger) {
      returnFocus = trigger; activeModal = index;
      modalElements[index].showModal();
      (index === 0 ? title : modalElements[index].querySelector('[data-close]')).focus();
    }
    for (const el of modalElements) {
      on(el, 'cancel', event => { event.preventDefault(); closeModal(); });
      on(el, 'click', event => {
        const rect = el.getBoundingClientRect();
        if (event.target === el && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeModal();
      });
    }
    function openEditor(id, trigger) {
      editing = id;
      const found = id && locate(board, id);
      title.value = found ? found.card.title : ''; description.value = found ? found.card.description : '';
      titleError.hidden = true; title.removeAttribute('aria-invalid');
      doc.getElementById('editor-heading').textContent = id ? '카드 수정' : '카드 추가';
      if (M.updateTextFields) M.updateTextFields();
      if (M.textareaAutoResize) M.textareaAutoResize(description);
      openModal(0, trigger);
    }
    on(addButton, 'click', () => openEditor(null, addButton));
    on(form, 'submit', event => {
      event.preventDefault();
      if (!title.value.trim()) { titleError.hidden = false; title.setAttribute('aria-invalid', 'true'); title.focus(); return; }
      const id = editing || (options.makeId ? options.makeId() : win.crypto.randomUUID());
      commit({ type: editing ? 'edit' : 'add', id, title: title.value, description: description.value }, editing ? '카드를 수정했습니다.' : '카드를 추가했습니다.', () => {
        if (editing) returnFocus = [...root.querySelectorAll('[data-card-id]')].find(el => el.dataset.cardId === id).querySelector('[data-action="edit"]');
        closeModal();
      });
    });
    on(title, 'input', () => { titleError.hidden = true; title.removeAttribute('aria-invalid'); });
    for (const modal of modalElements) on(modal, 'click', event => { if (event.target.closest('[data-close]')) closeModal(); });
    on(root, 'click', event => {
      const button = event.target.closest('[data-action]');
      if (!button || button.dataset.action === 'drag') return;
      const id = button.closest('[data-card-id]').dataset.cardId;
      if (button.dataset.action === 'edit') openEditor(id, button);
      else {
        deleting = id; doc.getElementById('delete-title').textContent = locate(board, id).card.title;
        openModal(1, button);
      }
    });
    on(doc.getElementById('confirm-delete'), 'click', () => {
      const found = locate(board, deleting);
      if (!found) return;
      commit({ type: 'delete', id: deleting }, '카드를 삭제했습니다.', () => {
        returnFocus = doc.getElementById(`heading-${found.status}`); closeModal();
      });
    });
    on(root, 'change', event => {
      const select = event.target.closest('.status-select'); if (!select) return;
      const id = select.closest('[data-card-id]').dataset.cardId;
      const found = locate(board, id); const status = select.value;
      if (!found || found.status === status || !STATUSES.includes(status)) return;
      commit({ type: 'move', id, status, index: board.columns[status].length }, `${found.card.title}: ${LABELS[status]}로 이동했습니다.`, () => focusCard(id));
    });
    // 드래그는 놓을 때만 모델을 변경합니다. 취소 시 별도 롤백이 필요하지 않습니다.
    let drag = null, frame = null;
    const indicator = element('div', 'drop-indicator'); indicator.setAttribute('aria-hidden', 'true');
    function destination(x, y) {
      for (const col of root.querySelectorAll('.kanban-column')) {
        const rect = col.getBoundingClientRect();
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
        const cards = [...col.querySelectorAll('[data-card-id]')].filter(node => node.dataset.cardId !== drag.id);
        let index = cards.findIndex(node => y < node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2);
        if (index < 0) index = cards.length;
        return { status: col.dataset.status, index, column: col, before: cards[index] || null };
      }
      return null;
    }
    function updateDrop() {
      indicator.remove(); root.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
      drag.target = destination(drag.x, drag.y);
      if (drag.target) {
        const { column, before } = drag.target;
        column.classList.add('drop-target'); column.querySelector('.card-list').insertBefore(indicator, before);
      }
    }
    function autoScroll() {
      frame = null;
      if (!drag || !drag.active) return;
      const speed = drag.y < 48 ? -12 : drag.y > win.innerHeight - 48 ? 12 : 0;
      if (speed) { win.scrollBy(0, speed); updateDrop(); }
      frame = win.requestAnimationFrame(autoScroll);
    }
    function cleanDrag() {
      if (!drag) return;
      if (frame !== null) win.cancelAnimationFrame(frame); frame = null;
      indicator.remove(); if (drag.ghost) drag.ghost.remove(); drag.node.classList.remove('is-dragging');
      root.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
      try { if (drag.handle.hasPointerCapture && drag.handle.hasPointerCapture(drag.pointerId)) drag.handle.releasePointerCapture(drag.pointerId); } catch (_) { /* capture may already be lost */ }
      drag = null;
    }
    on(root, 'pointerdown', event => {
      const handle = event.target.closest('.drag-handle');
      if (saving || blocked || !handle || drag || activeModal !== null || (event.button !== undefined && event.button !== 0) || event.isPrimary === false) return;
      const node = handle.closest('[data-card-id]');
      drag = { id: node.dataset.cardId, node, handle, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, active: false, ghost: null, target: null };
      if (handle.setPointerCapture) handle.setPointerCapture(event.pointerId);
    });
    on(doc, 'pointermove', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.x = event.clientX; drag.y = event.clientY;
      if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 8) return;
      event.preventDefault();
      if (!drag.active) {
        drag.active = true; const rect = drag.node.getBoundingClientRect();
        drag.ghost = drag.node.cloneNode(true); drag.ghost.classList.add('drag-ghost');
        drag.ghost.removeAttribute('data-card-id'); drag.ghost.removeAttribute('aria-labelledby'); drag.ghost.setAttribute('aria-hidden', 'true');
        drag.ghost.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        drag.ghost.querySelectorAll('button,select').forEach(el => { el.tabIndex = -1; el.disabled = true; });
        drag.ghost.style.width = `${rect.width}px`; doc.body.append(drag.ghost); drag.node.classList.add('is-dragging');
        frame = win.requestAnimationFrame(autoScroll);
      }
      drag.ghost.style.left = `${drag.x - 24}px`; drag.ghost.style.top = `${drag.y - 24}px`; updateDrop();
    });
    on(doc, 'pointerup', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (drag.active) { drag.x = event.clientX; drag.y = event.clientY; updateDrop(); }
      const { id, target, active } = drag; cleanDrag();
      if (active && target) {
        const found = locate(board, id);
        commit({ type: 'move', id, status: target.status, index: target.index }, `${found.card.title}: ${LABELS[target.status]}로 이동했습니다.`, () => focusCard(id, 'drag'));
      }
    });
    on(doc, 'pointercancel', event => { if (drag && event.pointerId === drag.pointerId) cleanDrag(); });
    on(root, 'lostpointercapture', event => { if (drag && event.pointerId === drag.pointerId) cleanDrag(); });
    on(win, 'blur', cleanDrag);
    on(doc, 'keydown', event => {
      if (event.key === 'Escape') { cleanDrag(); closeModal(); }
      if (event.key !== 'Tab' || activeModal === null) return;
      const focusable = [...modalElements[activeModal].querySelectorAll('button,input,textarea,select,[tabindex="0"]')].filter(el => !el.disabled && !el.hidden);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    showWarning(loaded.error); render(); addButton.disabled = false; addButton.hidden = false;
    doc.getElementById('board-workspace').hidden = false;
    return {
      getState: () => validateBoard(board),
      destroy: () => { destroyed = true; cleanDrag(); setSaving(false); listeners.forEach(off => off()); if (activeModal !== null) closeModal(); root.inert = false; },
    };
  }
  const api = { KEY, STATUSES, LABELS, emptyBoard, validateBoard, readBoard, writeBoard, locate, reduceBoard, createApp };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.KanbanBoard = api;
})();
