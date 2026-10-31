import type { MatchService, MatchSnapshot } from '../../features/match'

export function makeSnapshot(
  match: Partial<MatchSnapshot['match']> = {},
  extra: Partial<Omit<MatchSnapshot, 'match'>> = {},
): MatchSnapshot {
  return {
    match: {
      id: 'm1',
      mode: 'random',
      status: 'playing',
      inviteCode: null,
      firstSeat: 1,
      currentSeat: 1,
      turnStartedAt: new Date().toISOString(),
      turnSeconds: 30,
      maxAttempts: 9,
      lastChance: false,
      winnerSeat: null,
      endReason: null,
      expiresAt: null,
      settingDeadline: new Date(Date.now() + 60_000).toISOString(),
      ...match,
    },
    players: [
      { seat: 1, userId: 'me', ready: true, nickname: '민지', avatar: '🐯' },
      { seat: 2, userId: 'opp', ready: true, nickname: '비버', avatar: '🧢' },
    ],
    guesses: [],
    ...extra,
  }
}

/** 메모리 MatchService. snapshot 을 바꾸고 emit() 하면 구독자에게 변경을 알린다. */
export function createFakeMatchService(initial: MatchSnapshot = makeSnapshot()) {
  let snapshot = initial
  const listeners = new Set<() => void>()
  let onMatched: ((id: string) => void) | null = null
  const ready = Promise.resolve()

  const service = {
    getActiveMatch: vi.fn(async (): Promise<string | null> => null),
    createInvite: vi.fn(async () => ({ matchId: 'm1', inviteCode: 'ABC234' })),
    joinInvite: vi.fn(async () => 'm1'),
    enqueueRandom: vi.fn(async (): Promise<string | null> => null),
    cancelMatchmaking: vi.fn(async () => {}),
    setSecret: vi.fn(async () => {}),
    submitGuess: vi.fn(async () => ({ strike: 0, ball: 0, timedOut: false })),
    claimTimeout: vi.fn(async () => true),
    leave: vi.fn(async () => {}),
    fetchSnapshot: vi.fn(async () => snapshot),
    subscribeMatch: vi.fn((_id: string, onChange: () => void) => {
      listeners.add(onChange)
      return { ready, unsubscribe: () => listeners.delete(onChange) }
    }),
    subscribeMyMatches: vi.fn((_user: string, cb: (id: string) => void) => {
      onMatched = cb
      return { ready, unsubscribe: () => (onMatched = null) }
    }),
  } satisfies MatchService

  return {
    service,
    setSnapshot(next: MatchSnapshot) {
      snapshot = next
    },
    emit() {
      listeners.forEach((l) => l())
    },
    matched(id: string) {
      onMatched?.(id)
    },
  }
}
