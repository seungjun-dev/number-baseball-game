import { render, screen } from '@testing-library/react'
import { createGame, submitGuess } from '../logic'
import { ScoreList } from './ScoreList'

const guesses = submitGuess(submitGuess(createGame('3647'), '1234'), '1290').guesses

describe('ScoreList', () => {
  it('투구 번호, 숫자, 판정을 보여준다', () => {
    render(<ScoreList guesses={guesses} />)
    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('01')
    expect(rows[0]).toHaveTextContent('2 BALL · 0 STRIKES!')
    expect(rows[1]).toHaveTextContent('OUT!')
  })

  it("order='latest'면 최근 투구가 위에 온다", () => {
    render(<ScoreList guesses={guesses} order="latest" />)
    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('02')
    expect(rows[0]).toHaveTextContent('OUT!')
  })
})
