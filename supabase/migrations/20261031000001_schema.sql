-- =====================================================================
-- 숫자야구 온라인 대전 / 전적 — 스키마 + RLS
-- 설계: docs/ONLINE_MATCH_DESIGN.md
-- 원칙: 앱(anon/authenticated)은 읽기만, 쓰기는 RPC(security definer)로만.
--       예외: profiles 는 본인 행 insert/update 허용.
-- =====================================================================

-- 앱(Data API)에 노출하지 않는 내부 함수용 스키마
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 플레이어
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null check (char_length(btrim(nickname)) between 2 and 12),
  avatar text not null default '⚾' check (char_length(avatar) between 1 and 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is '플레이어 프로필 (auth.users 1:1)';

-- ---------------------------------------------------------------------
-- 대전
-- ---------------------------------------------------------------------
create type public.match_mode as enum ('invite', 'random');
create type public.match_status as enum ('waiting', 'setting', 'playing', 'finished', 'expired');
create type public.match_end_reason as enum ('solved', 'both_solved', 'max_attempts', 'forfeit', 'timeout_forfeit');

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  mode public.match_mode not null,
  status public.match_status not null,
  invite_code text,
  host_id uuid references auth.users (id) on delete set null,
  max_attempts smallint not null default 9 check (max_attempts between 1 and 20),
  turn_seconds smallint not null default 30 check (turn_seconds between 5 and 300),
  first_seat smallint check (first_seat in (1, 2)),
  current_seat smallint check (current_seat in (1, 2)),
  turn_started_at timestamptz,
  -- 선공이 먼저 맞혔을 때 후공에게 주어지는 마지막 기회 진행 중 여부
  last_chance boolean not null default false,
  winner_seat smallint check (winner_seat in (1, 2)),
  end_reason public.match_end_reason,
  created_at timestamptz not null default now(),
  expires_at timestamptz,           -- waiting(초대) 만료 시각
  setting_deadline timestamptz,     -- setting(비밀 숫자 설정) 마감 시각
  started_at timestamptz,
  finished_at timestamptz
);
comment on column public.matches.winner_seat is 'null + finished = 무승부';

-- 대기 중인 초대 코드는 유일해야 한다
create unique index matches_waiting_invite_code_key on public.matches (invite_code) where status = 'waiting';
create index matches_active_idx on public.matches (status) where status in ('waiting', 'setting', 'playing');

create table public.match_players (
  match_id uuid not null references public.matches (id) on delete cascade,
  seat smallint not null check (seat in (1, 2)),
  user_id uuid not null references auth.users (id) on delete cascade,
  ready boolean not null default false,
  consecutive_timeouts smallint not null default 0,
  joined_at timestamptz not null default now(),
  primary key (match_id, seat),
  unique (match_id, user_id)
);
create index match_players_user_idx on public.match_players (user_id);

-- 비밀 숫자: 앱에서 절대 읽을 수 없다 (RLS 정책 없음 + 권한 회수)
create table public.match_secrets (
  match_id uuid not null references public.matches (id) on delete cascade,
  seat smallint not null check (seat in (1, 2)),
  secret text not null,
  primary key (match_id, seat)
);

create table public.guesses (
  id bigint generated always as identity primary key,
  match_id uuid not null references public.matches (id) on delete cascade,
  seat smallint not null check (seat in (1, 2)),
  user_id uuid not null references auth.users (id) on delete cascade,
  turn_no smallint not null,          -- 해당 좌석의 몇 번째 투구인지 (1부터)
  guess text,                         -- 시간 초과면 null
  strike smallint not null default 0,
  ball smallint not null default 0,
  timed_out boolean not null default false,
  created_at timestamptz not null default now(),
  unique (match_id, seat, turn_no)
);

-- ---------------------------------------------------------------------
-- 랜덤 매칭 대기열
-- ---------------------------------------------------------------------
create table public.matchmaking_queue (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enqueued_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 싱글 플레이 기록 (클라이언트 보고값 — 온라인 전적과 달리 서버 검증 불가)
-- ---------------------------------------------------------------------
create table public.solo_games (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  attempts smallint not null check (attempts between 1 and 20),
  won boolean not null,
  created_at timestamptz not null default now()
);
create index solo_games_user_idx on public.solo_games (user_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_secrets enable row level security;
alter table public.guesses enable row level security;
alter table public.matchmaking_queue enable row level security;
alter table public.solo_games enable row level security;

-- 쓰기 권한은 기본적으로 모두 회수 (RPC가 security definer로 처리)
revoke insert, update, delete, truncate on
  public.matches, public.match_players, public.match_secrets, public.guesses,
  public.matchmaking_queue, public.solo_games
from anon, authenticated;
revoke all on public.match_secrets from anon, authenticated;
revoke all on all tables in schema public from anon;  -- 비로그인(anon 키만) 접근 차단
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant insert (id, nickname, avatar), update (nickname, avatar) on public.profiles to authenticated;

-- 참가자 여부 (정책에서 match_players 를 다시 조회하며 생기는 RLS 재귀를 피하기 위해 definer)
create function private.is_match_participant(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.match_players mp
    where mp.match_id = p_match_id and mp.user_id = (select auth.uid())
  );
$$;
grant usage on schema private to authenticated;
revoke all on function private.is_match_participant(uuid) from public, anon;
grant execute on function private.is_match_participant(uuid) to authenticated;

create policy "profiles: 로그인 사용자는 모두 조회" on public.profiles
  for select to authenticated using (true);
create policy "profiles: 본인 생성" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles: 본인 수정" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "matches: 참가자만 조회" on public.matches
  for select to authenticated using (private.is_match_participant(id));
create policy "match_players: 참가자만 조회" on public.match_players
  for select to authenticated using (private.is_match_participant(match_id));
create policy "guesses: 참가자만 조회" on public.guesses
  for select to authenticated using (private.is_match_participant(match_id));
create policy "matchmaking_queue: 본인만 조회" on public.matchmaking_queue
  for select to authenticated using (user_id = (select auth.uid()));
create policy "solo_games: 본인만 조회" on public.solo_games
  for select to authenticated using (user_id = (select auth.uid()));
-- match_secrets: 정책 없음 = 접근 불가

-- profiles.updated_at 자동 갱신
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------
-- Realtime: 경기 진행을 앱이 구독 (RLS가 적용되어 참가자만 수신)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.matches, public.match_players, public.guesses;
