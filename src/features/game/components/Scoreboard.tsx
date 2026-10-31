import { Eyebrow } from '../../../components'
import type { GuessRecord } from '../logic'
import { ScoreList } from './ScoreList'

type Props = {
  guesses: GuessRecord[]
  eyebrow?: string
  title?: string
  emptyText?: string
}

export function Scoreboard({
  guesses,
  eyebrow = 'SCOREBOARD',
  title = '경기 대시보드',
  emptyText = '첫 투구를 기다리는 중',
}: Props) {
  return (
    <section className="dashboard" aria-label={title}>
      <div className="dashboard-heading">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2>{title}</h2>
        </div>
        <span className="score-legend">
          <b>● S</b> 스트라이크　<b>● B</b> 볼
        </span>
      </div>
      {guesses.length === 0 ? (
        <div className="score-empty">
          {emptyText} <span>···</span>
        </div>
      ) : (
        <ScoreList guesses={guesses} order="latest" />
      )}
    </section>
  )
}
