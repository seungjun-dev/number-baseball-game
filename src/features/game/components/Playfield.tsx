import { isOut, type GuessRecord } from '../logic'
import type { PitchPhase } from '../hooks/useSinglePlayGame'

type Props = {
  phase: PitchPhase
  /** 이번에 던질 투구 번호 (1부터) */
  attempt: number
  maxAttempts: number
  lastGuess: GuessRecord | null
}

const pad = (n: number) => String(n).padStart(2, '0')

const BURST: Record<Exclude<PitchPhase, 'idle' | 'call'>, string> = {
  swing: 'SWING!',
  miss: 'WHOOSH!',
  victory: 'HOME RUN!',
}

const CAPTION: Record<Exclude<PitchPhase, 'idle' | 'call'>, string> = {
  swing: '타자가 힘껏 스윙!',
  miss: '공이 배트를 살짝 빗나가요!',
  victory: '정답! 승리의 순간을 즐겨요!',
}

/** 투구 연출 영역. 대기 중에는 일러스트, 투구 후에는 단계별 만화 연출을 보여준다. */
export function Playfield({ phase, attempt, maxAttempts, lastGuess }: Props) {
  const call = lastGuess?.call ?? ''

  if (phase === 'idle') {
    return (
      <div className="playfield idle">
        <div className="field-meta">
          <span>LIVE PLAY</span>
          <span>
            {pad(attempt)} / {pad(maxAttempts)}
          </span>
        </div>
        <div className="idle-illustration" aria-hidden="true">
          <div className="sun-disc" />
          <div className="bat-silhouette">🏏</div>
          <div className="standing-player">🧢</div>
          <div className="idle-speech">어디로 던져볼까?</div>
          <div className="field-mark mark-one" />
          <div className="field-mark mark-two" />
        </div>
        <div className="field-caption">타석의 긴장감을 느껴봐!</div>
      </div>
    )
  }

  const outCall =
    phase === 'call' && lastGuess && isOut(lastGuess) ? 'OUT!' : phase === 'victory' ? '4 STRIKE!' : ''

  return (
    <div className={`playfield ${phase}`}>
      <div className="field-meta">
        <span>PLAY BY PLAY</span>
        <span>REPLAY ●</span>
      </div>
      <div className={`cartoon-stage ${phase}`} aria-hidden="true">
        <div className="comic-burst">{phase === 'call' ? call : BURST[phase]}</div>
        <div className="comic-player">{phase === 'swing' ? '🏏' : phase === 'victory' ? '🏆' : '🧢'}</div>
        <div className="comic-ball">{phase === 'victory' ? '🌟' : '⚾'}</div>
        <div className="speed-line line-a" />
        <div className="speed-line line-b" />
        <div className="comic-dust">✦</div>
        <div className="out-call">{outCall}</div>
        <div className="win-confetti">✦　✧　✦</div>
      </div>
      <div className="field-caption result-caption" role="status">
        {phase === 'call' ? call : CAPTION[phase]}
      </div>
    </div>
  )
}
