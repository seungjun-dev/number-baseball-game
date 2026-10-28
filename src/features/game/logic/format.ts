import { isOut, type Judgement } from './judge'

/** 판정 결과를 중계 콜 문구로 만든다. 예: "2 BALL · 1 STRIKE!", "OUT!" */
export function formatCall(judgement: Judgement): string {
  if (isOut(judgement)) return 'OUT!'
  const { strike, ball } = judgement
  return `${ball} BALL · ${strike} STRIKE${strike === 1 ? '' : 'S'}!`
}

/** 숫자 사이에 구분자를 넣어 보여준다. 예: "1234" → "1 · 2 · 3 · 4" */
export const spaceDigits = (value: string, separator = '　'): string => value.split('').join(separator)
