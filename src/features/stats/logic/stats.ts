export type PlayerStats = {
  onlinePlayed: number
  onlineWins: number
  onlineLosses: number
  onlineDraws: number
  soloPlayed: number
  soloWins: number
  /** 싱글에서 이긴 판 중 가장 적은 투구 수 (승리 기록이 없으면 null) */
  soloBestAttempts: number | null
}

export const EMPTY_STATS: PlayerStats = {
  onlinePlayed: 0,
  onlineWins: 0,
  onlineLosses: 0,
  onlineDraws: 0,
  soloPlayed: 0,
  soloWins: 0,
  soloBestAttempts: null,
}

export type MatchOutcome = 'win' | 'loss' | 'draw'

export type MatchEndReason = 'solved' | 'both_solved' | 'max_attempts' | 'forfeit' | 'timeout_forfeit'

export type RecentMatch = {
  matchId: string
  finishedAt: string
  outcome: MatchOutcome
  endReason: MatchEndReason | null
  opponent: { nickname: string; avatar: string } | null
}

/** 승률(%) — 경기가 없으면 null */
export const winRate = (wins: number, played: number): number | null =>
  played === 0 ? null : Math.round((wins / played) * 100)

/** 내 좌석 기준 경기 결과 (winner_seat 가 null 이면 무승부) */
export const outcomeFor = (mySeat: number, winnerSeat: number | null): MatchOutcome =>
  winnerSeat === null ? 'draw' : winnerSeat === mySeat ? 'win' : 'loss'

export const OUTCOME_LABEL: Record<MatchOutcome, string> = { win: 'WIN', loss: 'LOSE', draw: 'DRAW' }

const REASON_LABEL: Record<MatchEndReason, string> = {
  solved: '정답',
  both_solved: '둘 다 정답',
  max_attempts: '기회 소진',
  forfeit: '기권',
  timeout_forfeit: '시간 초과 기권',
}

export const reasonLabel = (reason: MatchEndReason | null): string => (reason ? REASON_LABEL[reason] : '')

/** "10.31" 형식 날짜 */
export function shortDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
