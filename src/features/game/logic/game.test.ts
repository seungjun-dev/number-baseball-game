import { createGame, submitGuess } from './game'

describe('submitGuess', () => {
  it('규칙의 연습 게임을 그대로 재현한다 (정답 3647)', () => {
    let game = createGame('3647')
    for (const guess of ['1234', '5678', '1290', '4637']) {
      game = submitGuess(game, guess)
      expect(game.status).toBe('playing')
    }
    game = submitGuess(game, '3647')

    expect(game.status).toBe('won')
    expect(game.guesses.map((g) => g.call)).toEqual([
      '2 BALL · 0 STRIKES!',
      '1 BALL · 1 STRIKE!',
      'OUT!',
      '2 BALL · 2 STRIKES!',
      '0 BALL · 4 STRIKES!',
    ])
  })

  it('최대 투구 수를 다 쓰면 패배', () => {
    let game = createGame('3647', 2)
    game = submitGuess(game, '1234')
    expect(game.status).toBe('playing')
    game = submitGuess(game, '1290')
    expect(game.status).toBe('lost')
  })

  it('마지막 투구에서 맞히면 승리로 처리한다', () => {
    let game = createGame('3647', 2)
    game = submitGuess(submitGuess(game, '1234'), '3647')
    expect(game.status).toBe('won')
  })

  it('끝난 경기에는 추측이 반영되지 않는다', () => {
    const won = submitGuess(createGame('3647'), '3647')
    expect(submitGuess(won, '1234')).toBe(won)
  })

  it('원래 상태를 변경하지 않는다', () => {
    const game = createGame('3647')
    submitGuess(game, '1234')
    expect(game.guesses).toHaveLength(0)
  })
})
