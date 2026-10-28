import { DIGIT_COUNT } from './constants'

/** 0 이상 1 미만의 난수를 반환하는 함수 (테스트에서 고정값 주입용) */
export type RandomFn = () => number

/** 0~9 중 서로 다른 숫자로 이루어진 정답 문자열을 만든다. */
export function generateAnswer(random: RandomFn = Math.random, length: number = DIGIT_COUNT): string {
  const pool = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
  // Fisher–Yates 셔플을 앞에서부터 length 자리만 수행
  for (let i = 0; i < length; i++) {
    const j = i + Math.floor(random() * (pool.length - i))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, length).join('')
}
