-- 판정 규칙: src/features/game/logic/*.test.ts 와 같은 케이스
begin;
select plan(11);

select is((select row(strike, ball)::text from private.judge('3647', '1234')), '(0,2)', '1234 → 2볼');
select is((select row(strike, ball)::text from private.judge('3647', '5678')), '(1,1)', '5678 → 1스트라이크 1볼');
select is((select row(strike, ball)::text from private.judge('3647', '1290')), '(0,0)', '1290 → 아웃');
select is((select row(strike, ball)::text from private.judge('3647', '4637')), '(2,2)', '4637 → 2스트라이크 2볼');
select is((select row(strike, ball)::text from private.judge('3647', '3647')), '(4,0)', '3647 → 승리');

select ok(private.is_valid_number('0123'), '서로 다른 4자리 숫자는 유효');
select ok(not private.is_valid_number('1123'), '중복 숫자는 무효');
select ok(not private.is_valid_number('123'), '3자리는 무효');
select ok(not private.is_valid_number('12345'), '5자리는 무효');
select ok(not private.is_valid_number('12a4'), '문자 포함은 무효');
select ok(private.is_valid_number(null) is not true, 'null 은 무효');

select * from finish();
rollback;
