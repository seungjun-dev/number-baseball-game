import { useCallback, useEffect, useRef, useState } from 'react'
import { createGame, generateAnswer, MAX_ATTEMPTS, submitGuess, validateGuess, type GameState } from '../logic'

/** 투구 연출 단계: 대기 → 스윙 → 헛스윙 → 판정 콜 (정답이면 victory) */
export type PitchPhase = 'idle' | 'swing' | 'miss' | 'call' | 'victory'

/** 투구 직후부터 각 단계가 시작되는 시점 (ms) */
export type PitchTiming = {
  miss: number
  call: number
  /** 경기가 이어질 때 다시 대기 상태로 돌아가는 시점 */
  idle: number
  /** 경기가 끝났을 때 결과 화면으로 넘어가는 시점 */
  finish: number
}

export const DEFAULT_PITCH_TIMING: PitchTiming = { miss: 700, call: 1450, idle: 2500, finish: 3100 }

export type SinglePlayOptions = {
  createAnswer?: () => string
  maxAttempts?: number
  timing?: PitchTiming
  /** 경기 종료 연출까지 끝났을 때 한 번 호출 (전적 저장 등) */
  onGameEnd?: (game: GameState) => void
}

export function useSinglePlayGame({
  createAnswer = generateAnswer,
  maxAttempts = MAX_ATTEMPTS,
  timing = DEFAULT_PITCH_TIMING,
  onGameEnd,
}: SinglePlayOptions = {}) {
  const [game, setGame] = useState<GameState>(() => createGame(createAnswer(), maxAttempts))
  const [phase, setPhase] = useState<PitchPhase>('idle')
  /** 경기 종료 연출까지 끝나 결과를 보여줄 차례인지 */
  const [finished, setFinished] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const schedule = (fn: () => void, delay: number) => {
    timers.current.push(window.setTimeout(fn, delay))
  }

  const canPitch = phase === 'idle' && game.status === 'playing'

  /** 추측을 던진다. 지금 던질 수 없거나 입력이 잘못됐으면 false. */
  const pitch = (guess: string): boolean => {
    if (!canPitch || validateGuess(guess, game.answer.length) !== null) return false
    const next = submitGuess(game, guess)
    const over = next.status !== 'playing'
    setGame(next)
    setPhase('swing')
    schedule(() => setPhase('miss'), timing.miss)
    schedule(() => setPhase(next.status === 'won' ? 'victory' : 'call'), timing.call)
    if (over)
      schedule(() => {
        setFinished(true)
        onGameEnd?.(next)
      }, timing.finish)
    else schedule(() => setPhase('idle'), timing.idle)
    return true
  }

  const restart = () => {
    clearTimers()
    setGame(createGame(createAnswer(), maxAttempts))
    setPhase('idle')
    setFinished(false)
  }

  return {
    game,
    phase,
    finished,
    canPitch,
    lastGuess: game.guesses.at(-1) ?? null,
    pitch,
    restart,
  }
}
