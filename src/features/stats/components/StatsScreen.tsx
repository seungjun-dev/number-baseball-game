import { useState, type ReactNode } from 'react'
import { Eyebrow, TextButton } from '../../../components'
import type { StatsRepository } from '../api/statsRepository'
import { useStats } from '../hooks/useStats'
import { winRate } from '../logic/stats'
import { RecentMatchList } from './RecentMatchList'
import { StatTile } from './StatTile'

type Props = {
  repository: StatsRepository
  player: { id: string; nickname: string; avatar: string }
  /** 프로필 수정 폼 (player 기능에서 주입 — stats 가 player 에 직접 의존하지 않도록) */
  renderProfileEditor: (close: () => void) => ReactNode
  onBack: () => void
}

export function StatsScreen({ repository, player, renderProfileEditor, onBack }: Props) {
  const state = useStats(repository, player.id)
  const [editing, setEditing] = useState(false)

  return (
    <section className="stats-screen">
      <Eyebrow>MY RECORD</Eyebrow>
      <div className="stats-profile">
        <span className="stats-avatar" aria-hidden="true">
          {player.avatar}
        </span>
        <h1>{player.nickname}</h1>
        <TextButton onClick={() => setEditing((v) => !v)}>{editing ? '닫기' : '프로필 수정'}</TextButton>
      </div>
      {editing && <div className="login-box">{renderProfileEditor(() => setEditing(false))}</div>}

      {state.status === 'loading' && (
        <p className="score-empty" role="status">
          기록을 불러오는 중…
        </p>
      )}
      {state.status === 'error' && (
        <p className="form-error" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'ready' && (
        <>
          <div className="stat-grid">
            <StatTile
              label="1:1 대전"
              value={`${state.stats.onlineWins}승 ${state.stats.onlineLosses}패`}
              sub={`${state.stats.onlinePlayed}전 · ${state.stats.onlineDraws}무`}
            />
            <StatTile
              label="대전 승률"
              value={formatRate(winRate(state.stats.onlineWins, state.stats.onlinePlayed))}
            />
            <StatTile
              label="싱글 플레이"
              value={`${state.stats.soloWins}승`}
              sub={`${state.stats.soloPlayed}판 · 승률 ${formatRate(winRate(state.stats.soloWins, state.stats.soloPlayed))}`}
            />
            <StatTile
              label="싱글 최고 기록"
              value={state.stats.soloBestAttempts ? `${state.stats.soloBestAttempts}회` : '—'}
              sub="가장 적은 투구로 맞힌 기록"
            />
          </div>
          <div className="final-board">
            <Eyebrow>RECENT MATCHES</Eyebrow>
            <RecentMatchList matches={state.recent} />
          </div>
        </>
      )}
      <TextButton onClick={onBack}>← &nbsp; 홈으로</TextButton>
    </section>
  )
}

const formatRate = (rate: number | null) => (rate === null ? '—' : `${rate}%`)
