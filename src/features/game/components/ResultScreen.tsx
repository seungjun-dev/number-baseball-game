import { Eyebrow, PrimaryButton, TextButton } from '../../../components'
import { spaceDigits, type GuessRecord } from '../logic'
import { ScoreList } from './ScoreList'

type Props = {
  won: boolean
  answer: string
  guesses: GuessRecord[]
  onReplay: () => void
  onHome: () => void
}

export function ResultScreen({ won, answer, guesses, onReplay, onHome }: Props) {
  return (
    <section className="final-screen">
      <Eyebrow>FINAL SCORE / GAME OVER</Eyebrow>
      <div className="final-icon" aria-hidden="true">
        {won ? '🏆' : '⚾'}
      </div>
      <h1>
        {won ? (
          <>
            NICE
            <br />
            <em>HIT!</em>
          </>
        ) : (
          <>
            GOOD
            <br />
            <em>GAME.</em>
          </>
        )}
      </h1>
      <p>
        정답 숫자 <b aria-label={answer}>{spaceDigits(answer, ' · ')}</b> · {guesses.length}회 도전
      </p>
      <div className="final-board">
        <Eyebrow>YOUR SCOREBOARD</Eyebrow>
        <ScoreList guesses={guesses} />
      </div>
      <PrimaryButton onClick={onReplay}>한 판 더 하기 ↗</PrimaryButton>
      <TextButton onClick={onHome}>모드 선택으로 돌아가기</TextButton>
    </section>
  )
}
