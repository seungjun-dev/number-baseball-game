import { outcomeFor, reasonLabel, shortDate, winRate } from './stats'

describe('stats logic', () => {
  it('승률은 반올림한 퍼센트, 경기가 없으면 null', () => {
    expect(winRate(1, 3)).toBe(33)
    expect(winRate(2, 3)).toBe(67)
    expect(winRate(0, 0)).toBeNull()
  })

  it('내 좌석 기준 결과', () => {
    expect(outcomeFor(1, 1)).toBe('win')
    expect(outcomeFor(1, 2)).toBe('loss')
    expect(outcomeFor(2, null)).toBe('draw')
  })

  it('종료 사유 / 날짜 표기', () => {
    expect(reasonLabel('timeout_forfeit')).toBe('시간 초과 기권')
    expect(reasonLabel(null)).toBe('')
    expect(shortDate('2026-03-05T12:00:00')).toBe('03.05')
  })
})
