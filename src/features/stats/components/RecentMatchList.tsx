import { OUTCOME_LABEL, reasonLabel, shortDate, type RecentMatch } from '../logic/stats'

export function RecentMatchList({ matches }: { matches: RecentMatch[] }) {
  if (matches.length === 0) {
    return <div className="score-empty">아직 온라인 대전 기록이 없어요</div>
  }
  return (
    <ol className="score-list">
      {matches.map((m) => (
        <li className={`score-row match-row ${m.outcome}`} key={m.matchId}>
          <span>{shortDate(m.finishedAt)}</span>
          <b>
            <span aria-hidden="true">{m.opponent?.avatar ?? '❔'}</span> {m.opponent?.nickname ?? '알 수 없음'}
          </b>
          <small>
            {OUTCOME_LABEL[m.outcome]}
            {m.endReason && ` · ${reasonLabel(m.endReason)}`}
          </small>
        </li>
      ))}
    </ol>
  )
}
