import { isOut, isWin, judge } from './judge'

describe('judge — 규칙 예시 (정답 3647)', () => {
  it.each([
    ['1234', 0, 2],
    ['5678', 1, 1],
    ['1290', 0, 0],
    ['4637', 2, 2],
    ['3647', 4, 0],
  ])('%s → %i스트라이크 %i볼', (guess, strike, ball) => {
    expect(judge('3647', guess)).toEqual({ strike, ball })
  })
})

describe('isOut / isWin', () => {
  it('스트라이크와 볼이 모두 0이면 아웃', () => {
    expect(isOut({ strike: 0, ball: 0 })).toBe(true)
    expect(isOut({ strike: 0, ball: 1 })).toBe(false)
  })

  it('모든 자리가 스트라이크면 승리', () => {
    expect(isWin({ strike: 4, ball: 0 })).toBe(true)
    expect(isWin({ strike: 3, ball: 0 })).toBe(false)
  })
})
