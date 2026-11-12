const fs=require('fs');
const {createApp,KEY,emptyBoard}=require('../script.js');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
let app, storage, data, makeId;
const q=s=>document.querySelector(s);
const fire=(el,type,values={})=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,values);el.dispatchEvent(e);return e;};
function mount(saved=null, materialize=true){
 document.documentElement.innerHTML=html.replace(/<!doctype html>/i,'');
 document.querySelectorAll('dialog').forEach(el=>{el.showModal=()=>el.setAttribute('open','');el.close=()=>el.removeAttribute('open');});
 data=saved;storage={getItem:jest.fn(()=>data),setItem:jest.fn((k,v)=>{data=v;})};let id=0;makeId=()=>`card-${++id}`;
 const M={Modal:{},updateTextFields:jest.fn(),textareaAutoResize:jest.fn()};
 app=createApp(document,{storage,makeId,materialize:materialize?M:{}});
}
function add(title='첫 카드', description='설명'){q('#add-card').click();q('#card-title').value=title;q('#card-description').value=description;fire(q('#card-form'),'submit');}
function state(){return app.getState();}
function boxes(){
 const statuses=['todo','in-progress','done'];
 statuses.forEach((s,i)=>{q(`[data-status="${s}"]`).getBoundingClientRect=()=>({left:i*300,right:(i+1)*300,top:100,bottom:700,height:600});});
 document.querySelectorAll('[data-card-id]').forEach((el,i)=>el.getBoundingClientRect=()=>({left:0,right:250,top:150+i*120,bottom:250+i*120,height:100,width:250}));
}
function down(){const handle=q('.drag-handle');handle.setPointerCapture=jest.fn();handle.hasPointerCapture=()=>true;handle.releasePointerCapture=jest.fn();fire(handle,'pointerdown',{pointerId:1,button:0,clientX:30,clientY:170,pointerType:'touch'});return handle;}
function pointer(type,x,y,id=1){return fire(document,type,{pointerId:id,clientX:x,clientY:y,pointerType:'touch'});}
beforeEach(()=>{mount();jest.spyOn(window,'requestAnimationFrame').mockImplementation(()=>5);jest.spyOn(window,'cancelAnimationFrame').mockImplementation(()=>{});jest.spyOn(window,'scrollBy').mockImplementation(()=>{});});
afterEach(()=>{if(app)app.destroy();jest.restoreAllMocks();});
test('초기 빈 화면, 수와 저장 안 함',()=>{expect(q('#add-card').disabled).toBe(false);expect(document.querySelectorAll('.empty-state')).toHaveLength(3);expect(storage.setItem).not.toHaveBeenCalled();});
test('필수 제목 오류, 입력 시 오류 해제',()=>{add('  ');expect(q('#title-error').hidden).toBe(false);expect(q('#card-title').getAttribute('aria-invalid')).toBe('true');expect(document.activeElement).toBe(q('#card-title'));expect(state().columns.todo).toHaveLength(0);fire(q('#card-title'),'input');expect(q('#title-error').hidden).toBe(true);});
test('카드 추가·텍스트 안전 표시·개수·저장',()=>{add('<img src=x onerror=alert(1)>','첫 줄\n둘째 줄');expect(q('.card-title-text').textContent).toBe('<img src=x onerror=alert(1)>');expect(q('#board img')).toBeNull();expect(q('.count').textContent).toBe('1');expect(q('.card-description').textContent).toBe('첫 줄\n둘째 줄');expect(storage.setItem).toHaveBeenCalledWith(KEY,expect.any(String));expect(document.activeElement).toBe(q('#add-card'));});
test('수정 취소·저장·포커스 복원',()=>{add();q('[data-action="edit"]').click();q('#card-title').value='취소 내용';q('#card-modal [data-close]').click();expect(q('.card-title-text').textContent).toBe('첫 카드');q('[data-action="edit"]').click();q('#card-title').value='수정됨';fire(q('#card-form'),'submit');expect(q('.card-title-text').textContent).toBe('수정됨');expect(document.activeElement).toBe(q('[data-action="edit"]'));});
test('삭제 취소·확인·빈 상태·포커스',()=>{add();q('[data-action="delete"]').click();expect(document.activeElement).toBe(q('#delete-modal [data-close]'));q('#delete-modal [data-close]').click();expect(q('.kanban-card')).not.toBeNull();q('[data-action="delete"]').click();q('#confirm-delete').click();expect(q('.kanban-card')).toBeNull();expect(q('.count').textContent).toBe('0');expect(document.activeElement).toBe(q('#heading-todo'));});
test('상태 선택 이동·현재 상태 재선택 순서 유지',()=>{add();add('둘째 카드');const select=q('.status-select');select.value='todo';fire(select,'change');expect(state().columns.todo[0].title).toBe('첫 카드');select.value='done';fire(select,'change');expect(state().columns.done[0].title).toBe('첫 카드');expect(document.activeElement).toBe(q('[data-status="done"] select'));expect(q('#announcement').textContent).toContain('Done');});
test('모달 Tab 순환과 Escape 취소',()=>{q('#add-card').click();const save=q('#card-form [type="submit"]');save.focus();fire(document,'keydown',{key:'Tab',shiftKey:false});expect(document.activeElement).toBe(q('#card-title'));fire(document,'keydown',{key:'Tab',shiftKey:true});expect(document.activeElement).toBe(save);fire(document,'keydown',{key:'Escape'});expect(q('#card-modal').hasAttribute('open')).toBe(false);});
test('저장 실패 후 화면 유지·다음 성공 안내 해제',()=>{storage.setItem.mockImplementationOnce(()=>{throw Error('quota');});add();expect(q('#storage-warning').hidden).toBe(false);expect(state().columns.todo).toHaveLength(1);add('두 번째');expect(q('#storage-warning').hidden).toBe(true);});
test('실제 HTML로 재초기화해 컬럼·순서 복원',()=>{add();const value=data;app.destroy();mount(value);expect(q('.card-title-text').textContent).toBe('첫 카드');expect(storage.setItem).not.toHaveBeenCalled();});
test('손상 복원 안내와 기존 데이터 자동 덮어쓰기 방지',()=>{app.destroy();mount('{broken');expect(q('#storage-warning').hidden).toBe(false);expect(storage.setItem).not.toHaveBeenCalled();expect(data).toBe('{broken');add();expect(q('#storage-warning').hidden).toBe(true);});
test('Materialize 누락은 안내·초기화 중단',()=>{app.destroy();mount(null,false);expect(app).toBeNull();expect(q('#load-error').hidden).toBe(false);expect(q('#add-card').disabled).toBe(true);expect(storage.getItem).not.toHaveBeenCalled();});
test('localStorage getter 차단 시 빈 보드 조작 유지',()=>{app.destroy();const getter=jest.spyOn(window,'localStorage','get').mockImplementation(()=>{throw Error('blocked');});app=createApp(document,{materialize:{Modal:{init:()=>({open(){},close(){},destroy(){}})}},makeId:()=> 'x'});expect(q('#storage-warning').hidden).toBe(false);expect(app.getState()).toEqual(emptyBoard());getter.mockRestore();});

describe('Pointer Events 드래그',()=>{
 beforeEach(()=>{add();boxes();storage.setItem.mockClear();});
 test('터치 포인터가 빈 Done 컬럼으로 이동·저장·포커스',()=>{down();pointer('pointermove',630,200);expect(q('.drag-ghost')).not.toBeNull();expect(state().columns.todo).toHaveLength(1);pointer('pointerup',630,200);expect(state().columns.done).toHaveLength(1);expect(q('.drag-ghost')).toBeNull();expect(storage.setItem).toHaveBeenCalledTimes(1);expect(document.activeElement).toBe(q('[data-status="done"] .drag-handle'));expect(window.cancelAnimationFrame).toHaveBeenCalled();});
 test.each(['escape','cancel','outside','blur','lostcapture'])('%s 취소는 상태·저장 불변',mode=>{const handle=down();pointer('pointermove',630,200);if(mode==='escape')fire(document,'keydown',{key:'Escape'});if(mode==='cancel')pointer('pointercancel',630,200);if(mode==='outside')pointer('pointerup',-40,20);if(mode==='blur')fire(window,'blur');if(mode==='lostcapture')fire(handle,'lostpointercapture',{pointerId:1});expect(state().columns.todo).toHaveLength(1);expect(storage.setItem).not.toHaveBeenCalled();expect(q('.drag-ghost')).toBeNull();expect(q('.drop-indicator')).toBeNull();});
 test('8px 미만은 시작하지 않음, 다른 포인터 무시',()=>{down();pointer('pointermove',33,173);expect(q('.drag-ghost')).toBeNull();pointer('pointermove',630,200,2);pointer('pointerup',33,173);expect(state().columns.todo).toHaveLength(1);expect(storage.setItem).not.toHaveBeenCalled();});
 test('같은 컬럼 뒤로 재정렬',()=>{add('둘째 카드');boxes();down();pointer('pointermove',30,600);pointer('pointerup',30,600);expect(state().columns.todo.map(c=>c.title)).toEqual(['둘째 카드','첫 카드']);});
 test('가장자리 자동 스크롤·취소 후 루프 중단',()=>{down();pointer('pointermove',330,window.innerHeight-10);const tick=window.requestAnimationFrame.mock.calls.at(-1)[0];tick();expect(window.scrollBy).toHaveBeenCalledWith(0,12);pointer('pointercancel',330,200);expect(window.cancelAnimationFrame).toHaveBeenCalled();});
 test('우클릭으로 시작하지 않음',()=>{fire(q('.drag-handle'),'pointerdown',{pointerId:1,button:2,clientX:30,clientY:170});pointer('pointermove',630,200);expect(q('.drag-ghost')).toBeNull();});
});
