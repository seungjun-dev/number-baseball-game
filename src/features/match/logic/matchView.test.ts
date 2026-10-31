import type { MatchSnapshot } from '../api/types'
import { deriveMatchView, formatClock, secondsUntil } from './matchView'

const T0 = Date.parse('2026-10-31T10:00:00Z')

function snapshot(overrides: Partial<MatchSnapshot['match']> = {}, guesses: MatchSnapshot['guesses'] = []): MatchSnapshot {
  return {
    match: {
      id: 'm1',
      mode: 'random',
      status: 'playing',
      inviteCode: null,
      firstSeat: 1,
      currentSeat: 1,
      turnStartedAt: new Date(T0).toISOString(),
      turnSeconds: 30,
      maxAttempts: 9,
      lastChance: false,
      winnerSeat: null,
      endReason: null,
      expiresAt: null,
      settingDeadline: null,
      ...overrides,
    },
    players: [
      { seat: 1, userId: 'me', ready: true, nickname: '민지', avatar: '🐯' },
      { seat: 2, userId: 'opp', ready: true, nickname: '비버', avatar: '🧢' },
    ],
    guesses,
  }
}

describe('deriveMatchView', () => {
  it('내 좌석·상대·차례를 구분한다', () => {
    const view = deriveMatchView(snapshot(), 'me', T0)
    expect(view.me?.nickname).toBe('민지')
    expect(view.opponent?.nickname).toBe('비버')
    expect(view.isMyTurn).toBe(true)
    expect(deriveMatchView(snapshot(), 'opp', T0).isMyTurn).toBe(false)
  })

  it('남은 시간과 마감(여유 2초 포함) 여부', () => {
    expect(deriveMatchView(snapshot(), 'me', T0 + 10_400).remainingSeconds).toBe(20)
    expect(deriveMatchView(snapshot(), 'me', T0 + 31_000)).toMatchObject({ remainingSeconds: 0, deadlinePassed: false })
    expect(deriveMatchView(snapshot(), 'me', T0 + 32_500).deadlinePassed).toBe(true)
  })

  it('투구 기록을 내 것/상대 것으로 나누고 시간 초과를 표시한다', () => {
    const view = deriveMatchView(
      snapshot({}, [
        { seat: 1, turnNo: 1, guess: '1234', strike: 0, ball: 2, timedOut: false },
        { seat: 2, turnNo: 1, guess: null, strike: 0, ball: 0, timedOut: true },
      ]),
      'me',
      T0,
    )
    expect(view.myGuesses).toEqual([{ value: '1234', strike: 0, ball: 2, call: '2 BALL · 0 STRIKES!' }])
    expect(view.opponentGuesses[0]).toMatchObject({ value: '----', call: 'TIME OUT!' })
  })

  it('끝난 경기의 결과', () => {
    expect(deriveMatchView(snapshot({ status: 'finished', winnerSeat: 1 }), 'me', T0).outcome).toBe('win')
    expect(deriveMatchView(snapshot({ status: 'finished', winnerSeat: 1 }), 'opp', T0).outcome).toBe('loss')
    expect(deriveMatchView(snapshot({ status: 'finished', winnerSeat: null }), 'me', T0).outcome).toBe('draw')
    expect(deriveMatchView(snapshot({ status: 'finished' }), 'me', T0)).toMatchObject({
      remainingSeconds: null,
      isMyTurn: false,
    })
  })
})

describe('formatClock / secondsUntil', () => {
  it('시계 표기', () => {
    expect(formatClock(27)).toBe('0:27')
    expect(formatClock(600)).toBe('10:00')
  })

  it('마감까지 남은 초', () => {
    expect(secondsUntil(new Date(T0 + 59_200).toISOString(), T0)).toBe(60)
    expect(secondsUntil(new Date(T0 - 1000).toISOString(), T0)).toBe(0)
    expect(secondsUntil(null, T0)).toBe(0)
  })
})
