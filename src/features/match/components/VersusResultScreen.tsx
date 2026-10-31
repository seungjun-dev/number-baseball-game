import { Eyebrow, PrimaryButton, TextButton } from '../../../components'
import { ScoreList } from '../../game'
import { reasonLabel, type MatchEndReason } from '../../stats'
import type { MatchView } from '../logic/matchView'

type Props = {
  view: MatchView
  endReason: MatchEndReason | null
  onRematch: () => void
  onHome: () => void
}

const HEADLINE = {
  win: { icon: '🏆', top: 'YOU', bottom: 'WIN!' },
  loss: { icon: '⚾', top: 'GOOD', bottom: 'GAME.' },
  draw: { icon: '🤝', top: 'DRAW', bottom: 'GAME.' },
} as const

export function VersusResultScreen({ view, endReason, onRematch, onHome }: Props) {
  const headline = HEADLINE[view.outcome ?? 'draw']
  return (
    <section className="final-screen">
      <Eyebrow>FINAL SCORE / VERSUS</Eyebrow>
      <div className="final-icon" aria-hidden="true">
        {headline.icon}
      </div>
      <h1>
        {headline.top}
        <br />
        <em>{headline.bottom}</em>
      </h1>
      <p>
        {view.me?.avatar} {view.me?.nickname} vs {view.opponent?.avatar} {view.opponent?.nickname}
        {endReason && <> · <b>{reasonLabel(endReason)}</b></>}
      </p>
      <div className="final-board">
        <Eyebrow>MY PITCHES</Eyebrow>
        <ScoreList guesses={view.myGuesses} />
      </div>
      <div className="final-board">
        <Eyebrow>OPPONENT</Eyebrow>
        <ScoreList guesses={view.opponentGuesses} />
      </div>
      <PrimaryButton onClick={onRematch}>다시 대전하기 ↗</PrimaryButton>
      <TextButton onClick={onHome}>홈으로</TextButton>
    </section>
  )
}
