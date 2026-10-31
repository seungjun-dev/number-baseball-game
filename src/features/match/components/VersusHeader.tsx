import type { PlayerView } from '../logic/matchView'

type Props = {
  me: PlayerView | null
  opponent: PlayerView | null
  /** 현재 차례인 좌석 (강조 표시) */
  activeSeat?: number | null
  /** 준비 완료 표시 (비밀 숫자 설정 단계) */
  showReady?: boolean
}

function Side({ player, label, active, showReady }: { player: PlayerView | null; label: string; active: boolean; showReady?: boolean }) {
  return (
    <div className={`versus-side${active ? ' active' : ''}`}>
      <span className="versus-avatar" aria-hidden="true">
        {player?.avatar ?? '❔'}
      </span>
      <strong>{player?.nickname ?? '대기 중'}</strong>
      <small>
        {label}
        {showReady && player && (player.ready ? ' · 준비 완료' : ' · 준비 중')}
      </small>
    </div>
  )
}

export function VersusHeader({ me, opponent, activeSeat = null, showReady }: Props) {
  return (
    <div className="versus-header">
      <Side player={me} label="나" active={activeSeat !== null && activeSeat === me?.seat} showReady={showReady} />
      <span className="versus-vs">VS</span>
      <Side player={opponent} label="상대" active={activeSeat !== null && activeSeat === opponent?.seat} showReady={showReady} />
    </div>
  )
}
