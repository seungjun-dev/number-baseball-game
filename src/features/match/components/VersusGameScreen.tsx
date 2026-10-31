import { useState } from 'react'
import { PrimaryButton, TextButton } from '../../../components'
import { GuessInput, Scoreboard } from '../../game'
import { formatClock, type MatchView } from '../logic/matchView'
import { VersusHeader } from './VersusHeader'

type Props = {
  view: MatchView
  activeSeat: number | null
  onPitch: (guess: string) => Promise<void>
  onLeave: () => void
  error: string | null
}

function turnMessage(view: MatchView): string {
  if (view.lastChance) return view.isMyTurn ? '마지막 기회! 맞히면 무승부예요' : '상대의 마지막 기회!'
  return view.isMyTurn ? '내 차례! 상대 숫자를 맞혀보세요' : '상대가 생각하는 중…'
}

export function VersusGameScreen({ view, activeSeat, onPitch, onLeave, error }: Props) {
  const [busy, setBusy] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const urgent = view.isMyTurn && (view.remainingSeconds ?? 99) <= 10

  const pitch = async (guess: string) => {
    setBusy(true)
    try {
      await onPitch(guess)
    } catch {
      // 에러 문구는 상위에서 표시
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="match-screen">
      <VersusHeader me={view.me} opponent={view.opponent} activeSeat={activeSeat} />
      <div className={`turn-banner${view.isMyTurn ? ' mine' : ''}${urgent ? ' urgent' : ''}`} role="status">
        <span>{turnMessage(view)}</span>
        <b role="timer" aria-label="남은 시간">
          {formatClock(view.remainingSeconds ?? 0)}
        </b>
      </div>
      <GuessInput onPitch={(guess) => void pitch(guess)} disabled={!view.isMyTurn || busy} />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <Scoreboard
        guesses={view.myGuesses}
        eyebrow="MY PITCHES"
        title={`내 투구 ${view.myGuesses.length} / ${view.maxAttempts}`}
        emptyText="첫 투구를 기다리는 중"
      />
      <Scoreboard
        guesses={view.opponentGuesses}
        eyebrow="OPPONENT"
        title={`상대 투구 ${view.opponentGuesses.length} / ${view.maxAttempts}`}
        emptyText="상대의 첫 투구를 기다리는 중"
      />
      {confirmLeave ? (
        <div className="leave-confirm">
          <span>지금 나가면 기권패로 기록돼요.</span>
          <PrimaryButton onClick={onLeave}>기권하고 나가기</PrimaryButton>
          <TextButton onClick={() => setConfirmLeave(false)}>계속하기</TextButton>
        </div>
      ) : (
        <TextButton onClick={() => setConfirmLeave(true)}>← &nbsp; 경기 나가기</TextButton>
      )}
    </section>
  )
}
