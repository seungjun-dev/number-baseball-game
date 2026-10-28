import { DIGIT_COUNT } from './constants'

export type GuessError = 'length' | 'non-digit' | 'duplicate'

export const GUESS_ERROR_MESSAGES: Record<GuessError, string> = {
  length: `숫자 ${DIGIT_COUNT}개를 모두 입력해 주세요.`,
  'non-digit': '숫자만 입력할 수 있어요.',
  duplicate: '같은 숫자는 한 번만 쓸 수 있어요.',
}

/** 추측 입력이 규칙에 맞는지 검사한다. 문제가 없으면 null. */
export function validateGuess(guess: string, length: number = DIGIT_COUNT): GuessError | null {
  if (/\D/.test(guess)) return 'non-digit'
  if (guess.length !== length) return 'length'
  if (new Set(guess).size !== guess.length) return 'duplicate'
  return null
}
