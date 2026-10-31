-- =====================================================================
-- 숫자야구 온라인 대전 — 매칭 / 경기 진행 / 전적 RPC
-- 모든 public 함수는 security definer 이며 authenticated 만 실행 가능.
-- 에러는 message 에 기계가 읽을 수 있는 코드를 담는다 (예: 'not_your_turn').
--
-- 규칙 (docs/ONLINE_MATCH_DESIGN.md 7장 결정)
--   - 각자 비밀 숫자를 정하고 번갈아 상대 숫자를 맞힌다. 각자 최대 9회.
--   - 선공이 먼저 맞히면 후공에게 같은 횟수의 마지막 기회. 후공도 맞히면 무승부.
--   - 둘 다 9회 안에 못 맞히면 무승부.
--   - 투구 제한 시간 30초(+네트워크 여유 2초). 초과 시 그 턴은 아웃(시간 초과).
--     같은 사람이 3턴 연속 시간 초과면 기권패.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 내부 함수 (private)
-- ---------------------------------------------------------------------

-- 서로 다른 숫자 4자리인지
create function private.is_valid_number(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_value is not null
     and p_value ~ '^[0-9]{4}$'
     and (select count(distinct c) from regexp_split_to_table(p_value, '') as c) = 4;
$$;

-- 스트라이크/볼 판정 (src/features/game/logic/judge.ts 와 동일 규칙)
create function private.judge(p_secret text, p_guess text, out strike smallint, out ball smallint)
language sql
immutable
set search_path = ''
as $$
  select
    count(*) filter (where substr(p_guess, i, 1) = substr(p_secret, i, 1))::smallint,
    count(*) filter (where substr(p_guess, i, 1) <> substr(p_secret, i, 1)
                       and strpos(p_secret, substr(p_guess, i, 1)) > 0)::smallint
  from generate_series(1, char_length(p_guess)) as i;
$$;

-- 로그인 + 프로필 확인 후 user id 반환
create function private.require_player()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile_required';
  end if;
  return v_uid;
end;
$$;

-- 진행 중(대기/설정/경기)인 내 경기
create function private.active_match_id(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id
  from public.matches m
  join public.match_players mp on mp.match_id = m.id
  where mp.user_id = p_user_id and m.status in ('waiting', 'setting', 'playing')
  order by m.created_at desc
  limit 1;
$$;

-- 혼동되는 문자(0/O, 1/I/L)를 뺀 6자리 초대 코드
create function private.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_chars constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    select string_agg(substr(v_chars, 1 + floor(random() * char_length(v_chars))::int, 1), '')
      into v_code
    from generate_series(1, 6);
    exit when not exists (select 1 from public.matches where invite_code = v_code and status = 'waiting');
  end loop;
  return v_code;
end;
$$;

-- 두 사람으로 비밀 숫자 설정 단계의 경기를 만든다
create function private.create_setting_match(p_mode public.match_mode, p_user1 uuid, p_user2 uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match_id uuid;
begin
  insert into public.matches (mode, status, setting_deadline)
  values (p_mode, 'setting', now() + interval '60 seconds')
  returning id into v_match_id;

  insert into public.match_players (match_id, seat, user_id)
  values (v_match_id, 1, p_user1), (v_match_id, 2, p_user2);
  return v_match_id;
end;
$$;

-- 이번 턴 마감 시각 (네트워크 지연 여유 2초 포함)
create function private.turn_deadline(p_match public.matches)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select p_match.turn_started_at + make_interval(secs => p_match.turn_seconds + 2);
$$;

-- p_winner_seat 는 integer (호출부의 3 - seat 연산 결과를 그대로 받기 위함), null = 무승부
create function private.finish_match(p_match_id uuid, p_winner_seat int, p_reason public.match_end_reason)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.matches
     set status = 'finished', winner_seat = p_winner_seat, end_reason = p_reason,
         current_seat = null, last_chance = false, finished_at = now()
   where id = p_match_id;
$$;

-- 한 턴(투구 또는 시간 초과)이 끝난 뒤 승패 판정 / 차례 넘기기
create function private.after_turn(p_match public.matches, p_seat smallint, p_solved boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_other smallint := 3 - p_seat;
  v_my_count int;
  v_other_count int;
begin
  -- 후공의 마지막 기회였다면 결과 확정
  if p_match.last_chance then
    if p_solved then
      perform private.finish_match(p_match.id, null, 'both_solved');
    else
      perform private.finish_match(p_match.id, v_other, 'solved');
    end if;
    return;
  end if;

  select count(*) filter (where seat = p_seat), count(*) filter (where seat = v_other)
    into v_my_count, v_other_count
  from public.guesses where match_id = p_match.id;

  if p_solved then
    if p_seat = p_match.first_seat and v_other_count < v_my_count then
      -- 선공이 맞힘 → 후공에게 같은 횟수의 마지막 기회
      update public.matches
         set last_chance = true, current_seat = v_other, turn_started_at = now()
       where id = p_match.id;
    else
      perform private.finish_match(p_match.id, p_seat, 'solved');
    end if;
    return;
  end if;

  -- 후공까지 최대 횟수를 다 쓰면 무승부
  if p_seat <> p_match.first_seat and v_my_count >= p_match.max_attempts then
    perform private.finish_match(p_match.id, null, 'max_attempts');
    return;
  end if;

  update public.matches
     set current_seat = v_other, turn_started_at = now()
   where id = p_match.id;
end;
$$;

-- 현재 차례를 시간 초과(아웃)로 처리한다. 호출 전에 경기 행을 잠가야 한다.
create function private.apply_timeout(p_match public.matches)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seat smallint := p_match.current_seat;
  v_user uuid;
  v_timeouts smallint;
begin
  update public.match_players
     set consecutive_timeouts = consecutive_timeouts + 1
   where match_id = p_match.id and seat = v_seat
  returning user_id, consecutive_timeouts into v_user, v_timeouts;

  insert into public.guesses (match_id, seat, user_id, turn_no, guess, timed_out)
  values (
    p_match.id, v_seat, v_user,
    (select count(*) + 1 from public.guesses where match_id = p_match.id and seat = v_seat),
    null, true
  );

  if v_timeouts >= 3 then
    perform private.finish_match(p_match.id, 3 - v_seat, 'timeout_forfeit');
  else
    perform private.after_turn(p_match, v_seat, false);
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 공개 RPC
-- ---------------------------------------------------------------------

-- 진행 중인 내 경기 (앱 재실행 시 이어하기용)
create function public.get_active_match()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return private.active_match_id(private.require_player());
end;
$$;

-- 초대 코드로 방 만들기 (10분 후 만료)
create function public.create_invite_match()
returns table (match_id uuid, invite_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
  v_code text;
  v_match_id uuid;
begin
  if private.active_match_id(v_uid) is not null then
    raise exception 'already_in_match';
  end if;
  delete from public.matchmaking_queue where user_id = v_uid;

  v_code := private.generate_invite_code();
  insert into public.matches (mode, status, invite_code, host_id, expires_at)
  values ('invite', 'waiting', v_code, v_uid, now() + interval '10 minutes')
  returning id into v_match_id;
  insert into public.match_players (match_id, seat, user_id) values (v_match_id, 1, v_uid);

  return query select v_match_id, v_code;
end;
$$;

-- 초대 코드로 참가
create function public.join_invite_match(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
  v_match public.matches;
begin
  if private.active_match_id(v_uid) is not null then
    raise exception 'already_in_match';
  end if;

  select * into v_match from public.matches
   where invite_code = upper(btrim(p_code)) and status = 'waiting' and expires_at > now()
   for update;
  if not found then
    raise exception 'invite_not_found';
  end if;
  if v_match.host_id = v_uid then
    raise exception 'cannot_join_own_match';
  end if;

  delete from public.matchmaking_queue where user_id = v_uid;
  insert into public.match_players (match_id, seat, user_id) values (v_match.id, 2, v_uid);
  update public.matches
     set status = 'setting', setting_deadline = now() + interval '60 seconds'
   where id = v_match.id;
  return v_match.id;
end;
$$;

-- 랜덤 매칭 참가 + heartbeat 겸용. 대기 중에는 5~10초마다 다시 호출한다.
--   - 이미 매칭된 경기가 있으면 그 경기 id
--   - 상대를 찾으면 새 경기 id (상대는 Realtime 또는 다음 호출로 알게 됨)
--   - 못 찾으면 대기열 등록/갱신 후 null
create function public.enqueue_random_match()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
  v_active uuid;
  v_opponent uuid;
begin
  -- 매칭은 한 번에 하나씩 처리해 같은 사람이 두 경기에 잡히는 경합을 막는다
  perform pg_advisory_xact_lock(hashtext('number-baseball:matchmaking'));

  v_active := private.active_match_id(v_uid);
  if v_active is not null then
    delete from public.matchmaking_queue where user_id = v_uid;
    return v_active;
  end if;

  select q.user_id into v_opponent
  from public.matchmaking_queue q
  where q.user_id <> v_uid
    and q.last_seen_at > now() - interval '20 seconds'
  order by q.enqueued_at
  limit 1;

  if v_opponent is null then
    insert into public.matchmaking_queue (user_id) values (v_uid)
    on conflict (user_id) do update set last_seen_at = now();
    return null;
  end if;

  delete from public.matchmaking_queue where user_id in (v_uid, v_opponent);
  -- 먼저 기다린 사람이 1번 좌석
  return private.create_setting_match('random', v_opponent, v_uid);
end;
$$;

create function public.cancel_matchmaking()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.matchmaking_queue where user_id = private.require_player();
end;
$$;

-- 비밀 숫자 설정. 둘 다 준비되면 선공을 무작위로 정하고 경기 시작.
create function public.set_secret(p_match_id uuid, p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
  v_match public.matches;
  v_seat smallint;
  v_first smallint;
begin
  select * into v_match from public.matches where id = p_match_id for update;
  select seat into v_seat from public.match_players where match_id = p_match_id and user_id = v_uid;
  if v_match.id is null or v_seat is null then
    raise exception 'match_not_found';
  end if;
  if v_match.status <> 'setting' or v_match.setting_deadline <= now() then
    raise exception 'invalid_status';
  end if;
  if not private.is_valid_number(p_secret) then
    raise exception 'invalid_number';
  end if;
  if exists (select 1 from public.match_secrets where match_id = p_match_id and seat = v_seat) then
    raise exception 'secret_already_set';
  end if;

  insert into public.match_secrets (match_id, seat, secret) values (p_match_id, v_seat, p_secret);
  update public.match_players set ready = true where match_id = p_match_id and seat = v_seat;

  if (select count(*) from public.match_players where match_id = p_match_id and ready) = 2 then
    v_first := 1 + floor(random() * 2)::smallint;
    update public.matches
       set status = 'playing', first_seat = v_first, current_seat = v_first,
           turn_started_at = now(), started_at = now()
     where id = p_match_id;
  end if;
end;
$$;

-- 투구. 마감이 지났으면 시간 초과로 처리하고 timed_out = true 를 돌려준다.
create function public.submit_guess(p_match_id uuid, p_guess text)
returns table (strike smallint, ball smallint, timed_out boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
  v_match public.matches;
  v_seat smallint;
  v_secret text;
  v_result record;
begin
  select * into v_match from public.matches where id = p_match_id for update;
  select seat into v_seat from public.match_players where match_id = p_match_id and user_id = v_uid;
  if v_match.id is null or v_seat is null then
    raise exception 'match_not_found';
  end if;
  if v_match.status <> 'playing' then
    raise exception 'invalid_status';
  end if;
  if v_match.current_seat <> v_seat then
    raise exception 'not_your_turn';
  end if;
  if not private.is_valid_number(p_guess) then
    raise exception 'invalid_number';
  end if;

  if now() > private.turn_deadline(v_match) then
    perform private.apply_timeout(v_match);
    return query select 0::smallint, 0::smallint, true;
    return;
  end if;

  select secret into v_secret from public.match_secrets where match_id = p_match_id and seat = 3 - v_seat;
  select * into v_result from private.judge(v_secret, p_guess);

  insert into public.guesses (match_id, seat, user_id, turn_no, guess, strike, ball)
  values (
    p_match_id, v_seat, v_uid,
    (select count(*) + 1 from public.guesses g where g.match_id = p_match_id and g.seat = v_seat),
    p_guess, v_result.strike, v_result.ball
  );
  update public.match_players set consecutive_timeouts = 0 where match_id = p_match_id and seat = v_seat;

  perform private.after_turn(v_match, v_seat, v_result.strike = 4);
  return query select v_result.strike, v_result.ball, false;
end;
$$;

-- 상대 차례가 마감을 넘겼을 때 참가자 누구나 시간 초과를 확정할 수 있다 (cron 보다 빠른 반영용)
create function public.claim_timeout(p_match_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
  v_match public.matches;
begin
  if not exists (select 1 from public.match_players where match_id = p_match_id and user_id = v_uid) then
    raise exception 'match_not_found';
  end if;
  select * into v_match from public.matches where id = p_match_id for update;
  if v_match.status <> 'playing' or now() <= private.turn_deadline(v_match) then
    return false;
  end if;
  perform private.apply_timeout(v_match);
  return true;
end;
$$;

-- 경기 나가기: 대기 중이면 방 취소, 설정 중이면 무효, 경기 중이면 기권패
create function public.leave_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
  v_match public.matches;
  v_seat smallint;
begin
  select * into v_match from public.matches where id = p_match_id for update;
  select seat into v_seat from public.match_players where match_id = p_match_id and user_id = v_uid;
  if v_match.id is null or v_seat is null then
    raise exception 'match_not_found';
  end if;

  if v_match.status in ('waiting', 'setting') then
    update public.matches set status = 'expired', finished_at = now() where id = p_match_id;
  elsif v_match.status = 'playing' then
    perform private.finish_match(p_match_id, 3 - v_seat, 'forfeit');
  end if;
end;
$$;

-- 싱글 플레이 결과 기록
create function public.record_solo_game(p_attempts int, p_won boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.require_player();
begin
  if p_attempts not between 1 and 9 then
    raise exception 'invalid_attempts';
  end if;
  insert into public.solo_games (user_id, attempts, won) values (v_uid, p_attempts, p_won);
end;
$$;

-- 전적 (다른 플레이어 것도 조회 가능 — 상대 전적 보기)
create function public.get_player_stats(p_user_id uuid default null)
returns table (
  online_played int, online_wins int, online_losses int, online_draws int,
  solo_played int, solo_wins int, solo_best_attempts int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_target uuid := coalesce(p_user_id, private.require_player());
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  return query
  with online as (
    select m.winner_seat, mp.seat
    from public.matches m
    join public.match_players mp on mp.match_id = m.id
    where mp.user_id = v_target and m.status = 'finished'
  ), solo as (
    select attempts, won from public.solo_games where user_id = v_target
  )
  select
    (select count(*) from online)::int,
    (select count(*) from online where winner_seat = seat)::int,
    (select count(*) from online where winner_seat is not null and winner_seat <> seat)::int,
    (select count(*) from online where winner_seat is null)::int,
    (select count(*) from solo)::int,
    (select count(*) from solo where won)::int,
    (select min(attempts) from solo where won)::int;
end;
$$;

-- ---------------------------------------------------------------------
-- 정리 작업 (pg_cron, 10초마다)
-- ---------------------------------------------------------------------
create function private.sweep()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
begin
  -- 만료된 초대 방 / 설정 마감이 지난 경기
  update public.matches set status = 'expired', finished_at = now()
   where (status = 'waiting' and expires_at <= now())
      or (status = 'setting' and setting_deadline <= now());

  -- 접속이 끊긴 대기열
  delete from public.matchmaking_queue where last_seen_at <= now() - interval '20 seconds';

  -- 마감이 지난 턴은 시간 초과 처리 (다른 트랜잭션이 잡고 있는 경기는 건너뜀)
  for v_match in
    select * from public.matches
     where status = 'playing' and now() > private.turn_deadline(matches)
     for update skip locked
  loop
    perform private.apply_timeout(v_match);
  end loop;
end;
$$;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('number-baseball-sweep', '10 seconds', 'select private.sweep()');

-- ---------------------------------------------------------------------
-- 실행 권한: 로그인 사용자만, 내부 함수는 노출하지 않음
-- ---------------------------------------------------------------------
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_match_participant(uuid) to authenticated;

revoke execute on function
  public.get_active_match(),
  public.create_invite_match(),
  public.join_invite_match(text),
  public.enqueue_random_match(),
  public.cancel_matchmaking(),
  public.set_secret(uuid, text),
  public.submit_guess(uuid, text),
  public.claim_timeout(uuid),
  public.leave_match(uuid),
  public.record_solo_game(int, boolean),
  public.get_player_stats(uuid)
from public, anon;

grant execute on function
  public.get_active_match(),
  public.create_invite_match(),
  public.join_invite_match(text),
  public.enqueue_random_match(),
  public.cancel_matchmaking(),
  public.set_secret(uuid, text),
  public.submit_guess(uuid, text),
  public.claim_timeout(uuid),
  public.leave_match(uuid),
  public.record_solo_game(int, boolean),
  public.get_player_stats(uuid)
to authenticated;
