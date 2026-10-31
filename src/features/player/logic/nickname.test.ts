import { normalizeNickname, validateNickname } from './nickname'

describe('nickname', () => {
  it('앞뒤 공백과 연속 공백을 정리한다', () => {
    expect(normalizeNickname('  민지   야구 ')).toBe('민지 야구')
  })

  it.each([
    ['민', '2자 이상'],
    ['   ', '2자 이상'],
    ['가나다라마바사아자차카타파', '12자까지'],
  ])('%s → %s 안내', (value, message) => {
    expect(validateNickname(value)).toContain(message)
  })

  it('2~12자면 통과', () => {
    expect(validateNickname('민지')).toBeNull()
    expect(validateNickname('가나다라마바사아자차카')).toBeNull()
  })
})
