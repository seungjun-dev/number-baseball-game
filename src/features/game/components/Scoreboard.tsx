import { Eyebrow } from '../../../components'
import type { GuessRecord } from '../logic'
import { ScoreList } from './ScoreList'

export function Scoreboard({ guesses }: { guesses: GuessRecord[] }) {
  return (
    <section className="dashboard" aria-label="경기 대시보드">
      <div className="dashboard-heading">
        <div>
          <Eyebrow>SCOREBOARD</Eyebrow>
          <h2>경기 대시보드</h2>
        </div>
        <span className="score-legend">
          <b>● S</b> 스트라이크　<b>● B</b> 볼
        </span>
      </div>
      {guesses.length === 0 ? (
        <div className="score-empty">
          첫 투구를 기다리는 중 <span>···</span>
        </div>
      ) : (
        <ScoreList guesses={guesses} order="latest" />
      )}
    </section>
  )
}
