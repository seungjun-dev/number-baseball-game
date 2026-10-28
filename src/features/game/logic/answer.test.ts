import { generateAnswer } from './answer'

describe('generateAnswer', () => {
  it('서로 다른 숫자 4개를 만든다', () => {
    for (let i = 0; i < 200; i++) {
      const answer = generateAnswer()
      expect(answer).toMatch(/^\d{4}$/)
      expect(new Set(answer).size).toBe(4)
    }
  })

  it('주입한 난수로 결과를 고정할 수 있다', () => {
    expect(generateAnswer(() => 0)).toBe('0123')
    expect(generateAnswer(() => 0.999)).toBe('9012')
  })

  it('자릿수를 바꿀 수 있다', () => {
    expect(generateAnswer(Math.random, 3)).toHaveLength(3)
  })
})
