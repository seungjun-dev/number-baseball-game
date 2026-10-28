import { MAX_ATTEMPTS } from './constants'
import { formatCall } from './format'
import { isWin, judge, type Judgement } from './judge'

export type GuessRecord = Judgement & { value: string; call: string }

export type GameStatus = 'playing' | 'won' | 'lost'

export type GameState = {
  answer: string
  guesses: GuessRecord[]
  status: GameStatus
  maxAttempts: number
}

export function createGame(answer: string, maxAttempts: number = MAX_ATTEMPTS): GameState {
  return { answer, guesses: [], status: 'playing', maxAttempts }
}

/**
 * 검증된 추측을 경기에 반영한 새 상태를 돌려준다.
 * 이미 끝난 경기에는 아무 변화도 주지 않는다.
 */
export function submitGuess(state: GameState, guess: string): GameState {
  if (state.status !== 'playing') return state
  const judgement = judge(state.answer, guess)
  const guesses = [...state.guesses, { value: guess, ...judgement, call: formatCall(judgement) }]
  const status: GameStatus = isWin(judgement, state.answer.length)
    ? 'won'
    : guesses.length >= state.maxAttempts
      ? 'lost'
      : 'playing'
  return { ...state, guesses, status }
}
