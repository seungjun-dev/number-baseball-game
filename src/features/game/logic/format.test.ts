import { formatCall, spaceDigits } from './format'

describe('formatCall', () => {
  it.each([
    [{ strike: 0, ball: 0 }, 'OUT!'],
    [{ strike: 0, ball: 2 }, '2 BALL · 0 STRIKES!'],
    [{ strike: 1, ball: 1 }, '1 BALL · 1 STRIKE!'],
    [{ strike: 4, ball: 0 }, '0 BALL · 4 STRIKES!'],
  ])('%o → %s', (judgement, call) => {
    expect(formatCall(judgement)).toBe(call)
  })
})

describe('spaceDigits', () => {
  it('숫자 사이에 구분자를 넣는다', () => {
    expect(spaceDigits('3647', ' · ')).toBe('3 · 6 · 4 · 7')
  })
})
