import { DIGIT_COUNT } from './constants'

export type Judgement = { strike: number; ball: number }

/** 정답과 추측을 비교해 스트라이크/볼 개수를 센다. */
export function judge(answer: string, guess: string): Judgement {
  let strike = 0
  let ball = 0
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) strike++
    else if (answer.includes(guess[i])) ball++
  }
  return { strike, ball }
}

export const isOut = ({ strike, ball }: Judgement): boolean => strike + ball === 0

export const isWin = ({ strike }: Judgement, length: number = DIGIT_COUNT): boolean => strike === length
