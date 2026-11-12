const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { emptyBoard } = require('../script.js');
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
(async()=>{
 const db = new PGlite();const checks=[];
 const asUser=async(id,role='authenticated')=>{await db.exec(`reset role;set role ${role};`);await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);};
 const save=(board,version)=>db.query('select * from public.save_kanban_board($1::jsonb,$2::bigint)',[JSON.stringify(board),version]);
 try {
  await db.exec(`create role anon;create role authenticated;create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
    insert into auth.users values('${A}'),('${B}');
    create table public.todos(id text primary key,text text);insert into public.todos values('keep','기존 todo 보존');
    create function public.todo_sentinel() returns text language sql as $$select 'original'::text$$;`);
  const sql=fs.readFileSync(require.resolve('../supabase/schema.sql'),'utf8');await db.exec(sql);await db.exec(sql);
  assert.deepEqual((await db.query('select * from public.todos')).rows,[{id:'keep',text:'기존 todo 보존'}]);
  assert.equal((await db.query('select public.todo_sentinel() as value')).rows[0].value,'original');checks.push('기존 todo 데이터·함수 보존 및 SQL 재실행');
  await asUser(A);assert.equal(Number((await save(emptyBoard(),0)).rows[0].version),1);
  const next=emptyBoard();next.columns.todo.push({id:'a',title:'나의 카드',description:''});assert.equal(Number((await save(next,1)).rows[0].version),2);
  await asUser(B);assert.deepEqual((await db.query('select * from public.kanban_boards')).rows,[]);assert.equal((await save(emptyBoard(),0)).rows[0].user_id,B);checks.push('A/B 사용자 격리·생성·수정 버전 증가');
  await asUser(A);await assert.rejects(save(emptyBoard(),1),/VERSION_CONFLICT/);assert.equal((await db.query('select board from public.kanban_boards')).rows[0].board.columns.todo[0].title,'나의 카드');checks.push('오래된 버전 충돌·원본 보존');
  await assert.rejects(db.query('insert into public.kanban_boards(user_id,board) values($1,$2::jsonb)',[B,JSON.stringify(emptyBoard())]));assert.deepEqual((await db.query('update public.kanban_boards set board=$1::jsonb where user_id=$2 returning user_id',[JSON.stringify(emptyBoard()),B])).rows,[]);checks.push('RLS 소유자 위조·다른 사용자 수정 거부');
  await asUser(null,'anon');await assert.rejects(db.query('select * from public.kanban_boards'));await assert.rejects(save(emptyBoard(),0));checks.push('비로그인 조회·RPC 거부');
  await asUser(A);const invalid=emptyBoard();invalid.columns.todo=[{id:'same',title:'a',description:''},{id:'same',title:'b',description:''}];await assert.rejects(save(invalid,2),/INVALID_BOARD/);await assert.rejects(save({...emptyBoard(),version:2},2),/INVALID_BOARD/);checks.push('중복 ID·미지원 버전 보드 거부');
  console.log(JSON.stringify({passed:checks.length,checks}));
 } finally {await db.close();}
})().catch(error=>{console.error(error);process.exit(1);});
