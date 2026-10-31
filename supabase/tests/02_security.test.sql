-- 보안: RLS / 권한
begin;
select plan(12);

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-0000-0000-00000000000a', 'authenticated', 'authenticated', 'a@test.local'),
  ('00000000-0000-0000-0000-00000000000b', 'authenticated', 'authenticated', 'b@test.local'),
  ('00000000-0000-0000-0000-00000000000c', 'authenticated', 'authenticated', 'c@test.local');
insert into public.profiles (id, nickname) values
  ('00000000-0000-0000-0000-00000000000a', '에이스'),
  ('00000000-0000-0000-0000-00000000000b', '비버'),
  ('00000000-0000-0000-0000-00000000000c', '관전자');

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
create temp table ctx (match_id uuid, code text);
grant all on ctx to authenticated;

-- A가 방을 만들고 B가 참가, 둘 다 비밀 숫자 설정
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
insert into ctx select match_id, invite_code from public.create_invite_match();
reset role;
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select public.join_invite_match((select code from ctx));
select public.set_secret((select match_id from ctx), '3647');
reset role;
select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select public.set_secret((select match_id from ctx), '1234');

-- 참가자 A
select throws_ok('select * from public.match_secrets', '42501', null, '참가자도 비밀 숫자 테이블은 읽을 수 없다');
select is((select count(*)::int from public.matches), 1, '참가자는 자기 경기를 볼 수 있다');
select is((select count(*)::int from public.match_players), 2, '참가자는 상대 참가 정보를 볼 수 있다');
select throws_ok(
  $$insert into public.guesses (match_id, seat, user_id, turn_no, guess, strike, ball)
    values ((select match_id from ctx), 1, auth.uid(), 1, '3647', 4, 0)$$,
  '42501', null, '투구를 테이블에 직접 넣을 수 없다');
select throws_ok(
  $$update public.matches set status = 'finished', winner_seat = 1$$,
  '42501', null, '경기 결과를 직접 바꿀 수 없다');
select throws_ok(
  $$update public.profiles set created_at = now() - interval '1 year' where id = auth.uid()$$,
  '42501', null, '프로필은 닉네임/아바타만 수정할 수 있다');
select lives_ok(
  $$update public.profiles set nickname = '새이름' where id = auth.uid()$$,
  '본인 닉네임은 수정할 수 있다');
update public.profiles set nickname = '해킹' where id = '00000000-0000-0000-0000-00000000000b';
reset role;
select is((select nickname from public.profiles where id = '00000000-0000-0000-0000-00000000000b'), '비버',
  '다른 사람 프로필은 수정되지 않는다');

-- 제3자 C
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.matches), 0, '제3자는 남의 경기를 볼 수 없다');
select is((select count(*)::int from public.guesses), 0, '제3자는 남의 투구를 볼 수 없다');
select throws_ok(
  $$select public.submit_guess((select match_id from ctx), '1234')$$,
  'P0001', 'match_not_found', '제3자는 남의 경기에 투구할 수 없다');
reset role;

-- 비로그인(anon)
set local role anon;
select throws_ok('select public.enqueue_random_match()', '42501', null, 'anon 은 RPC 를 실행할 수 없다');
reset role;

select * from finish();
rollback;
