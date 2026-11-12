-- Supabase SQL Editor에서 전체 실행. 기존 todos·todo RPC는 변경하지 않습니다.
begin;

create or replace function public.kanban_board_is_valid(p_board jsonb)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare status text; card jsonb; ids text[] := '{}'::text[];
begin
  if jsonb_typeof(p_board) is distinct from 'object'
    or p_board->'version' is distinct from '1'::jsonb
    or jsonb_typeof(p_board->'columns') is distinct from 'object' then return false; end if;
  foreach status in array array['todo','in-progress','done'] loop
    if jsonb_typeof(p_board->'columns'->status) is distinct from 'array' then return false; end if;
    for card in select value from jsonb_array_elements(p_board->'columns'->status) loop
      if jsonb_typeof(card) is distinct from 'object'
        or jsonb_typeof(card->'id') is distinct from 'string'
        or length(btrim(card->>'id', E' \t\n\r')) = 0
        or (card->>'id') = any(ids)
        or jsonb_typeof(card->'title') is distinct from 'string'
        or length(btrim(card->>'title', E' \t\n\r')) = 0
        or jsonb_typeof(card->'description') is distinct from 'string' then return false; end if;
      ids := array_append(ids, card->>'id');
    end loop;
  end loop;
  return true;
end;
$$;

create table if not exists public.kanban_boards (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  board jsonb not null check (public.kanban_board_is_valid(board)),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.kanban_touch_board()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists kanban_touch_board on public.kanban_boards;
create trigger kanban_touch_board before update on public.kanban_boards
for each row execute function public.kanban_touch_board();

alter table public.kanban_boards enable row level security;
revoke all on public.kanban_boards from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update on public.kanban_boards to authenticated;
drop policy if exists kanban_select_own on public.kanban_boards;
create policy kanban_select_own on public.kanban_boards for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists kanban_insert_own on public.kanban_boards;
create policy kanban_insert_own on public.kanban_boards for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists kanban_update_own on public.kanban_boards;
create policy kanban_update_own on public.kanban_boards for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 전체 보드를 하나의 트랜잭션으로 저장해 드래그 순서의 부분 저장을 방지합니다.
create or replace function public.save_kanban_board(p_board jsonb, p_expected_version bigint)
returns setof public.kanban_boards
language plpgsql security invoker set search_path = '' as $$
declare current_version bigint;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode = '42501'; end if;
  if not public.kanban_board_is_valid(p_board) then raise exception 'INVALID_BOARD'; end if;
  if p_expected_version is null or p_expected_version < 0 then raise exception 'VERSION_CONFLICT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 14));
  select b.version into current_version from public.kanban_boards b where b.user_id = auth.uid() for update;
  if not found then
    if p_expected_version <> 0 then raise exception 'VERSION_CONFLICT'; end if;
    insert into public.kanban_boards(user_id, board) values(auth.uid(), p_board);
  else
    if current_version <> p_expected_version then raise exception 'VERSION_CONFLICT'; end if;
    update public.kanban_boards set board = p_board where user_id = auth.uid();
  end if;
  return query select b.* from public.kanban_boards b where b.user_id = auth.uid();
end;
$$;

revoke all on function public.kanban_board_is_valid(jsonb), public.kanban_touch_board(), public.save_kanban_board(jsonb,bigint) from public, anon, authenticated;
grant execute on function public.kanban_board_is_valid(jsonb), public.save_kanban_board(jsonb,bigint) to authenticated;
commit;
