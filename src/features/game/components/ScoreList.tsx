import { spaceDigits, type GuessRecord } from '../logic'

type Props = {
  guesses: GuessRecord[]
  /** 'latest': 최근 투구가 위 (경기 중), 'first': 첫 투구가 위 (결과 화면) */
  order?: 'latest' | 'first'
}

export function ScoreList({ guesses, order = 'first' }: Props) {
  const rows = guesses.map((guess, i) => ({ guess, no: i + 1 }))
  if (order === 'latest') rows.reverse()
  return (
    <ol className="score-list">
      {rows.map(({ guess, no }) => (
        <li className="score-row" key={no}>
          <span>{String(no).padStart(2, '0')}</span>
          <b aria-label={guess.value}>{spaceDigits(guess.value)}</b>
          <small>{guess.call}</small>
        </li>
      ))}
    </ol>
  )
}
