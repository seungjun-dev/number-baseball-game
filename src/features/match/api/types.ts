import type { MatchEndReason } from '../../stats'

export type MatchStatus = 'waiting' | 'setting' | 'playing' | 'finished' | 'expired'

export type MatchSnapshot = {
  match: {
    id: string
    mode: 'invite' | 'random'
    status: MatchStatus
    inviteCode: string | null
    firstSeat: number | null
    currentSeat: number | null
    turnStartedAt: string | null
    turnSeconds: number
    maxAttempts: number
    lastChance: boolean
    winnerSeat: number | null
    endReason: MatchEndReason | null
    expiresAt: string | null
    settingDeadline: string | null
  }
  players: { seat: number; userId: string; ready: boolean; nickname: string; avatar: string }[]
  guesses: { seat: number; turnNo: number; guess: string | null; strike: number; ball: number; timedOut: boolean }[]
}

export type Subscription = {
  /** DB 변경 스트림이 준비되면 resolve (준비 전 변경은 놓칠 수 있다) */
  ready: Promise<void>
  unsubscribe: () => void
}

export interface MatchService {
  getActiveMatch(): Promise<string | null>
  createInvite(): Promise<{ matchId: string; inviteCode: string }>
  joinInvite(code: string): Promise<string>
  /** 랜덤 매칭 참가/heartbeat. 매칭되면 경기 id, 대기 중이면 null */
  enqueueRandom(): Promise<string | null>
  cancelMatchmaking(): Promise<void>
  setSecret(matchId: string, secret: string): Promise<void>
  submitGuess(matchId: string, guess: string): Promise<{ strike: number; ball: number; timedOut: boolean }>
  claimTimeout(matchId: string): Promise<boolean>
  leave(matchId: string): Promise<void>
  fetchSnapshot(matchId: string): Promise<MatchSnapshot>
  /** 경기(상태·참가자·투구) 변경 구독 */
  subscribeMatch(matchId: string, onChange: () => void): Subscription
  /** 내가 새 경기에 배정되는 순간(랜덤 매칭 성사) 구독 */
  subscribeMyMatches(userId: string, onMatched: (matchId: string) => void): Subscription
}
