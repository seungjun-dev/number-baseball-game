import { formatCall, type GuessRecord } from '../../game'
import { outcomeFor, type MatchOutcome } from '../../stats'
import type { MatchSnapshot, MatchStatus } from '../api/types'

/** 네트워크 지연 여유 (서버 private.turn_deadline 과 동일) */
export const TURN_GRACE_SECONDS = 2

export type PlayerView = { seat: number; nickname: string; avatar: string; ready: boolean }

export type MatchView = {
  status: MatchStatus
  me: PlayerView | null
  opponent: PlayerView | null
  isMyTurn: boolean
  /** 선공이 맞혀서 후공에게 주어진 마지막 기회 진행 중 */
  lastChance: boolean
  /** 남은 턴 시간(초). 경기 중이 아니면 null */
  remainingSeconds: number | null
  /** 여유 시간까지 지나 시간 초과를 확정할 수 있음 */
  deadlinePassed: boolean
  myGuesses: GuessRecord[]
  opponentGuesses: GuessRecord[]
  maxAttempts: number
  outcome: MatchOutcome | null
}

const toRecord = (g: MatchSnapshot['guesses'][number]): GuessRecord =>
  g.timedOut
    ? { value: '----', strike: 0, ball: 0, call: 'TIME OUT!' }
    : { value: g.guess ?? '', strike: g.strike, ball: g.ball, call: formatCall(g) }

/** 서버 스냅샷 + 내 user id + 현재 시각으로 화면에 필요한 값을 계산한다. */
export function deriveMatchView(snapshot: MatchSnapshot, myUserId: string, now: number): MatchView {
  const { match, players, guesses } = snapshot
  const meRow = players.find((p) => p.userId === myUserId) ?? null
  const oppRow = players.find((p) => p.userId !== myUserId) ?? null
  const toView = (p: typeof meRow): PlayerView | null =>
    p && { seat: p.seat, nickname: p.nickname, avatar: p.avatar, ready: p.ready }

  const playing = match.status === 'playing' && match.turnStartedAt !== null
  const elapsed = playing ? (now - Date.parse(match.turnStartedAt!)) / 1000 : 0

  return {
    status: match.status,
    me: toView(meRow),
    opponent: toView(oppRow),
    isMyTurn: playing && meRow !== null && match.currentSeat === meRow.seat,
    lastChance: match.lastChance,
    remainingSeconds: playing ? Math.max(0, Math.ceil(match.turnSeconds - elapsed)) : null,
    deadlinePassed: playing && elapsed > match.turnSeconds + TURN_GRACE_SECONDS,
    myGuesses: guesses.filter((g) => g.seat === meRow?.seat).map(toRecord),
    opponentGuesses: guesses.filter((g) => g.seat === oppRow?.seat).map(toRecord),
    maxAttempts: match.maxAttempts,
    outcome: match.status === 'finished' && meRow ? outcomeFor(meRow.seat, match.winnerSeat) : null,
  }
}

/** 남은 초 → "0:27" */
export const formatClock = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/** 마감 시각까지 남은 초 (지났으면 0) */
export const secondsUntil = (iso: string | null, now: number): number =>
  iso ? Math.max(0, Math.ceil((Date.parse(iso) - now) / 1000)) : 0
