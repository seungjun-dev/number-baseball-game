import { validateGuess } from './validate'

describe('validateGuess', () => {
  it('서로 다른 숫자 4개면 통과', () => {
    expect(validateGuess('0123')).toBeNull()
  })

  it.each([
    ['123', 'length'],
    ['12345', 'length'],
    ['12a4', 'non-digit'],
    ['1123', 'duplicate'],
  ])('%s → %s', (guess, error) => {
    expect(validateGuess(guess)).toBe(error)
  })
})
