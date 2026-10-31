import { toUserMessage, unwrap } from './errors'

describe('toUserMessage', () => {
  it('서버 에러 코드를 한국어 문구로 바꾼다', () => {
    expect(toUserMessage({ message: 'not_your_turn' })).toBe('상대 차례예요.')
  })

  it('네트워크 에러를 구분한다', () => {
    expect(toUserMessage(new TypeError('Failed to fetch'))).toContain('네트워크')
  })

  it('모르는 에러는 기본 문구', () => {
    expect(toUserMessage('boom')).toBe('잠시 후 다시 시도해 주세요.')
  })
})

describe('unwrap', () => {
  it('에러가 있으면 던지고 없으면 data를 돌려준다', () => {
    expect(unwrap({ data: 1, error: null })).toBe(1)
    expect(() => unwrap({ data: null, error: { message: 'x' } })).toThrow()
    expect(() => unwrap({ data: null, error: null })).toThrow('empty_response')
  })
})
