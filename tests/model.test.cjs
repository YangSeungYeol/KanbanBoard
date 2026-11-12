const {KEY, STATUSES, emptyBoard, validateBoard, readBoard, writeBoard, reduceBoard} = require('../script.js');
const card = (id, title = id) => ({id, title, description: ''});
const populated = () => ({version:1, columns:{todo:[card('a'),card('b'),card('c')], 'in-progress':[], done:[]}});
const move = (id,status,index) => ({type:'move',id,status,index});

describe('상태와 데이터 계약', () => {
  test('초기 빈 보드와 독립된 배열', () => { const a=emptyBoard(), b=emptyBoard(); a.columns.todo.push(card('a')); expect(b.columns.todo).toEqual([]); expect(STATUSES).toEqual(['todo','in-progress','done']); });
  test('추가 제목 trim과 설명 줄바꿈 보존, 원본 불변', () => {const a=emptyBoard(); const b=reduceBoard(a,{type:'add',id:'a',title:'  제목  ',description:' 첫 줄\n둘째 줄 '}); expect(b.columns.todo[0]).toEqual({id:'a',title:'제목',description:' 첫 줄\n둘째 줄 '});expect(a.columns.todo).toHaveLength(0);});
  test.each(['', '  ', '\n'])('빈 제목 %j 거부', title => {const a=emptyBoard();expect(reduceBoard(a,{type:'add',id:'a',title,description:''})).toBe(a);});
  test('수정은 ID·순서 유지, 삭제는 한 카드만 제거',()=>{const b=reduceBoard(populated(),{type:'edit',id:'b',title:'수정',description:'설명'});expect(b.columns.todo.map(x=>x.id)).toEqual(['a','b','c']);expect(b.columns.todo[1].title).toBe('수정');expect(reduceBoard(b,{type:'delete',id:'b'}).columns.todo.map(x=>x.id)).toEqual(['a','c']);});
  test.each(STATUSES.flatMap(from=>STATUSES.filter(to=>to!==from).map(to=>[from,to])))('%s → %s 이동과 원본 보존', (from,to)=>{const a=emptyBoard();a.columns[from]=[card('a')];const b=reduceBoard(a,move('a',to,0));expect(b.columns[from]).toHaveLength(0);expect(b.columns[to]).toEqual([card('a')]);expect(a.columns[from]).toHaveLength(1);});
  test.each([['a',2,['b','c','a']],['c',0,['c','a','b']]])('같은 컬럼 %s → %i', (id,index,ids)=>{expect(reduceBoard(populated(),move(id,'todo',index)).columns.todo.map(x=>x.id)).toEqual(ids);});
  test.each([{type:'delete',id:'missing'},move('a','bad',0),move('a','todo',-1),move('a','todo',3),move('a','todo',0.5),move('a','todo',0),{type:'edit',id:'missing',title:'x',description:''},{type:'add',id:'a',title:'중복',description:''},{type:'other'}])('잘못된 작업·동일 위치는 변경하지 않음 %j', action=>{const b=populated();expect(reduceBoard(b,action)).toBe(b);});
  test('추가 필드는 제거한 새 객체로 복원',()=>{const b=populated();b.extra=true;b.columns.todo[0].unsafe='x';const clean=validateBoard(b);expect(clean.extra).toBeUndefined();expect(clean.columns.todo[0].unsafe).toBeUndefined();expect(clean).not.toBe(b);});
  test.each([
    null, {version:2,columns:emptyBoard().columns}, {version:1,columns:{}},
    {version:1,columns:{todo:[],done:[], 'in-progress':{}}},
    {version:1,columns:{todo:[card('a'),card('a')],done:[],'in-progress':[]}},
    {version:1,columns:{todo:[card('a',' ')],done:[],'in-progress':[]}},
    {version:1,columns:{todo:[{id:'a',title:'x',description:7}],done:[],'in-progress':[]}}
  ])('잘못된 스키마 거부 %j', input=>expect(()=>validateBoard(input)).toThrow());
});
describe('localStorage',()=>{
  test('키 없음은 빈 보드, 초기 쓰기 없음',()=>{const storage={getItem:jest.fn(()=>null),setItem:jest.fn()};expect(readBoard(storage)).toEqual({board:emptyBoard(),error:''});expect(storage.getItem).toHaveBeenCalledWith(KEY);expect(storage.setItem).not.toHaveBeenCalled();});
  test('상태와 순서 저장·복원',()=>{const data=new Map();const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};const b=reduceBoard(populated(),move('a','done',0));expect(writeBoard(storage,b)).toBe('');expect(readBoard(storage).board).toEqual(b);});
  test.each(['{broken','null','{"version":2}'])('손상 값 %s는 보존하고 빈 상태·안내 반환',raw=>{const storage={getItem:()=>raw,setItem:jest.fn()};expect(readBoard(storage).error).not.toBe('');expect(readBoard(storage).board).toEqual(emptyBoard());expect(storage.setItem).not.toHaveBeenCalled();});
  test('읽기 차단·쓰기 용량 초과 후 재시도',()=>{const storage={getItem:()=>{throw Error('blocked');},setItem:jest.fn().mockImplementationOnce(()=>{throw Error('quota');})};expect(readBoard(storage).error).toBeTruthy();expect(writeBoard(storage,populated())).toContain('저장');expect(writeBoard(storage,populated())).toBe('');});
});
