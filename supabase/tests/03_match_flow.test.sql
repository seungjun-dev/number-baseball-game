-- 대전 진행: 초대, 랜덤 매칭, 공정성(마지막 기회), 무승부, 시간 초과, 기권, 전적
begin;
select plan(44);

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'c@test.local'),
  ('00000000-0000-0000-0000-00000000000d', 'authenticated', 'authenticated', 'd@test.local');
insert into public.profiles (id, nickname) values
  ('00000000-0000-0000-0000-00000000000a', '에이스'),
  ('00000000-0000-0000-0000-00000000000b', '비버'),
  ('00000000-0000-0000-0000-00000000000c', '체리');
-- d 는 프로필 없음

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
create temp table ctx (name text primary key, match_id uuid, code text);
grant all on ctx to authenticated;
create function pg_temp.m(p_name text) returns uuid language sql as $$ select match_id from ctx where name = p_name $$;
create function pg_temp.code(p_name text) returns text language sql as $$ select code from ctx where name = p_name $$;

-- A(seat1, 비밀 1234) vs B(seat2, 비밀 3647) 경기를 만들고 선공을 seat1 로 고정
create function pg_temp.start_match(p_name text) returns void language plpgsql as $$
begin
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  insert into ctx select p_name, match_id, invite_code from public.create_invite_match();
  perform pg_temp.login('00000000-0000-0000-0000-00000000000b');
  perform public.join_invite_match(pg_temp.code(p_name));
  perform public.set_secret(pg_temp.m(p_name), '3647');
  perform pg_temp.login('00000000-0000-0000-0000-00000000000a');
  perform public.set_secret(pg_temp.m(p_name), '1234');
  reset role;
  update public.matches set first_seat = 1, current_seat = 1 where id = pg_temp.m(p_name);
end;
$$;

create function pg_temp.guess(p_user text, p_name text, p_guess text) returns text language plpgsql as $$
declare r record;
begin
  perform pg_temp.login(('00000000-0000-0000-0000-00000000000' || p_user)::uuid);
  select * into r from public.submit_guess(pg_temp.m(p_name), p_guess);
  reset role;
  return r.strike || 'S' || r.ball || 'B' || case when r.timed_out then ' timeout' else '' end;
end;
$$;

-- ---------------------------------------------------------------- 인증/프로필
select pg_temp.login('00000000-0000-0000-0000-00000000000d');
select throws_ok('select public.create_invite_match()', 'P0001', 'profile_required', '프로필이 없으면 경기를 만들 수 없다');
reset role;

-- ---------------------------------------------------------------- 초대 코드
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
insert into ctx select 'invite', match_id, invite_code from public.create_invite_match();
reset role;
select matches(
  (select invite_code from public.matches where id = pg_temp.m('invite')),
  '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$', '초대 코드는 혼동 문자 없는 6자리');
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select throws_ok('select public.create_invite_match()', 'P0001', 'already_in_match', '진행 중인 경기가 있으면 새 방을 못 만든다');
select throws_ok(
  format('select public.join_invite_match(%L)', (select invite_code from public.matches where id = pg_temp.m('invite'))),
  'P0001', 'already_in_match', '방장은 자기 방에 다시 참가할 수 없다');
reset role;
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select throws_ok($$select public.join_invite_match('ZZZZZZ')$$, 'P0001', 'invite_not_found', '없는 코드는 참가 불가');
select is(
  public.join_invite_match(lower(pg_temp.code('invite'))),
  pg_temp.m('invite'), '코드는 대소문자 구분 없이 참가된다');
reset role;
select is((select status::text from public.matches where id = pg_temp.m('invite')), 'setting', '참가하면 비밀 숫자 설정 단계');

select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select throws_ok(format('select public.set_secret(%L, %L)', pg_temp.m('invite'), '1123'), 'P0001', 'invalid_number', '중복 숫자는 비밀 숫자로 못 쓴다');
select public.set_secret(pg_temp.m('invite'), '3647');
select throws_ok(format('select public.set_secret(%L, %L)', pg_temp.m('invite'), '1234'), 'P0001', 'secret_already_set', '비밀 숫자는 바꿀 수 없다');
reset role;
select is((select status::text from public.matches where id = pg_temp.m('invite')), 'setting', '한 명만 준비되면 아직 시작 전');
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select public.set_secret(pg_temp.m('invite'), '1234');
reset role;
select ok(
  (select status = 'playing' and first_seat in (1, 2) and current_seat = first_seat and turn_started_at is not null
     from public.matches where id = pg_temp.m('invite')),
  '둘 다 준비되면 선공을 정하고 시작');
-- 경기 정리 (다음 테스트에서 A/B 가 새 경기를 만들 수 있게)
update public.matches set status = 'expired' where id = pg_temp.m('invite');

-- ---------------------------------------------------------------- 공정성: 둘 다 맞히면 무승부
select pg_temp.start_match('draw');
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select throws_ok(format('select public.submit_guess(%L, %L)', pg_temp.m('draw'), '1234'), 'P0001', 'not_your_turn', '내 차례가 아니면 투구 불가');
reset role;
select is(pg_temp.guess('a', 'draw', '1234'), '0S2B', 'A: 1234 → 2볼 (B 비밀 3647)');
select is(pg_temp.guess('b', 'draw', '5678'), '0S0B', 'B: 5678 → 아웃 (A 비밀 1234)');
select is(pg_temp.guess('a', 'draw', '3647'), '4S0B', 'A: 정답');
select ok(
  (select status = 'playing' and last_chance and current_seat = 2 from public.matches where id = pg_temp.m('draw')),
  '선공이 맞히면 후공에게 마지막 기회');
select is(pg_temp.guess('b', 'draw', '1234'), '4S0B', 'B: 마지막 기회에 정답');
select ok(
  (select status = 'finished' and winner_seat is null and end_reason = 'both_solved' from public.matches where id = pg_temp.m('draw')),
  '둘 다 같은 횟수에 맞히면 무승부');

-- ---------------------------------------------------------------- 공정성: 마지막 기회 실패 → 선공 승
select pg_temp.start_match('first_wins');
select pg_temp.guess('a', 'first_wins', '3647');
select is(pg_temp.guess('b', 'first_wins', '5678'), '0S0B', 'B: 마지막 기회 실패');
select ok(
  (select status = 'finished' and winner_seat = 1 and end_reason = 'solved' from public.matches where id = pg_temp.m('first_wins')),
  '후공이 마지막 기회를 놓치면 선공 승');

-- ---------------------------------------------------------------- 후공이 먼저 맞히면 즉시 승리
select pg_temp.start_match('second_wins');
select pg_temp.guess('a', 'second_wins', '5678');
select pg_temp.guess('b', 'second_wins', '1234');
select ok(
  (select status = 'finished' and winner_seat = 2 and end_reason = 'solved' from public.matches where id = pg_temp.m('second_wins')),
  '후공이 맞히면 (선공은 같은 횟수에 실패했으므로) 즉시 후공 승');

-- ---------------------------------------------------------------- 최대 횟수 소진 → 무승부
select pg_temp.start_match('max');
update public.matches set max_attempts = 2 where id = pg_temp.m('max');
select pg_temp.guess('a', 'max', '5678');
select pg_temp.guess('b', 'max', '5678');
select pg_temp.guess('a', 'max', '9012');
select ok((select status = 'playing' from public.matches where id = pg_temp.m('max')), '선공이 마지막 횟수를 써도 후공 차례가 남는다');
select pg_temp.guess('b', 'max', '9012');
select ok(
  (select status = 'finished' and winner_seat is null and end_reason = 'max_attempts' from public.matches where id = pg_temp.m('max')),
  '둘 다 최대 횟수를 쓰면 무승부');
select throws_ok(
  format('select public.submit_guess(%L, %L)', pg_temp.m('max'), '1234'),
  'P0001', null, '끝난 경기에는 투구할 수 없다');

-- ---------------------------------------------------------------- 시간 초과
select pg_temp.start_match('timeout');
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is(public.claim_timeout(pg_temp.m('timeout')), false, '마감 전에는 시간 초과를 확정할 수 없다');
reset role;
update public.matches set turn_started_at = now() - interval '33 seconds' where id = pg_temp.m('timeout');
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is(public.claim_timeout(pg_temp.m('timeout')), true, '마감(30초+2초)이 지나면 상대가 시간 초과를 확정');
reset role;
select ok(
  (select timed_out and guess is null and turn_no = 1 from public.guesses where match_id = pg_temp.m('timeout') and seat = 1),
  '시간 초과는 아웃 1회로 기록');
select is((select current_seat from public.matches where id = pg_temp.m('timeout')), 2::smallint, '시간 초과 후 차례가 넘어간다');

-- 본인이 늦게 투구해도 서버 시각 기준으로 시간 초과 처리
select pg_temp.guess('b', 'timeout', '5678');
update public.matches set turn_started_at = now() - interval '40 seconds' where id = pg_temp.m('timeout');
select is(pg_temp.guess('a', 'timeout', '3647'), '0S0B timeout', '마감 후 투구는 정답이어도 시간 초과');

-- 3턴 연속 시간 초과 → 기권패
select pg_temp.guess('b', 'timeout', '9012');
update public.matches set turn_started_at = now() - interval '40 seconds' where id = pg_temp.m('timeout');
select private.sweep();
select ok(
  (select status = 'finished' and winner_seat = 2 and end_reason = 'timeout_forfeit' from public.matches where id = pg_temp.m('timeout')),
  '같은 사람이 3턴 연속 시간 초과면 (정리 작업이 처리해도) 기권패');

-- ---------------------------------------------------------------- 기권
select pg_temp.start_match('forfeit');
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select public.leave_match(pg_temp.m('forfeit'));
reset role;
select ok(
  (select status = 'finished' and winner_seat = 2 and end_reason = 'forfeit' from public.matches where id = pg_temp.m('forfeit')),
  '경기 중 나가면 기권패');

-- ---------------------------------------------------------------- 랜덤 매칭
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select is(public.enqueue_random_match(), null, '대기열이 비어 있으면 대기');
select is(public.enqueue_random_match(), null, '다시 호출하면 heartbeat (여전히 대기)');
reset role;
select is((select count(*)::int from public.matchmaking_queue), 1, '대기열에 한 번만 들어간다');

select pg_temp.login('00000000-0000-0000-0000-00000000000b');
insert into ctx select 'random', public.enqueue_random_match();
reset role;
select isnt(pg_temp.m('random'), null, '두 번째 사람이 오면 즉시 매칭');
select ok(
  (select mode = 'random' and status = 'setting' from public.matches where id = pg_temp.m('random')),
  '랜덤 매칭 경기는 비밀 숫자 설정 단계로 시작');
select is(
  (select user_id from public.match_players where match_id = pg_temp.m('random') and seat = 1),
  '00000000-0000-0000-0000-00000000000a'::uuid, '먼저 기다린 사람이 1번 좌석');
select is((select count(*)::int from public.matchmaking_queue), 0, '매칭되면 대기열에서 빠진다');

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select is(public.enqueue_random_match(), pg_temp.m('random'), '기다리던 사람은 다음 heartbeat 에서 매칭된 경기를 받는다');
reset role;

-- 오래된 대기열(앱 종료 등)과는 매칭되지 않는다
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select public.enqueue_random_match();
reset role;
update public.matchmaking_queue set last_seen_at = now() - interval '1 minute';
select private.sweep();
select is((select count(*)::int from public.matchmaking_queue), 0, '정리 작업이 오래된 대기열을 지운다');

select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select public.enqueue_random_match();
select public.cancel_matchmaking();
reset role;
select is((select count(*)::int from public.matchmaking_queue), 0, '매칭 취소');

-- ---------------------------------------------------------------- 전적
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select public.record_solo_game(5, true);
select public.record_solo_game(9, false);
select throws_ok('select public.record_solo_game(0, true)', 'P0001', 'invalid_attempts', '싱글 기록 횟수 검증');
-- A: draw(무), first_wins(승), second_wins(패), max(무), timeout(패), forfeit(패)
select is(
  (select row(online_played, online_wins, online_losses, online_draws, solo_played, solo_wins, solo_best_attempts)::text
     from public.get_player_stats()),
  '(6,1,3,2,2,1,5)', '내 전적 (온라인 6전 1승 3패 2무, 싱글 2판 1승 최고 5회)');
select is(
  (select row(online_played, online_wins, online_losses, online_draws)::text
     from public.get_player_stats('00000000-0000-0000-0000-00000000000b')),
  '(6,3,1,2)', '상대 전적도 조회할 수 있다');
reset role;

select * from finish();
rollback;
