import { PrimaryButton, TextButton } from '../../../components'
import { useMatch } from '../hooks/useMatch'
import type { MatchService } from '../api/types'
import { secondsUntil } from '../logic/matchView'
import { InviteWaitingScreen } from './InviteWaitingScreen'
import { SecretSetupScreen } from './SecretSetupScreen'
import { VersusGameScreen } from './VersusGameScreen'
import { VersusResultScreen } from './VersusResultScreen'

type Props = {
  service: MatchService
  matchId: string
  userId: string
  onLobby: () => void
  onHome: () => void
}

/** 경기 하나의 진행 상태(대기 → 비밀 숫자 → 경기 → 결과)에 맞는 화면을 보여준다. */
export function MatchRoom({ service, matchId, userId, onLobby, onHome }: Props) {
  const { snapshot, view, error, now, refresh, setSecret, submitGuess, leave } = useMatch(service, matchId, userId)
  const leaveTo = (next: () => void) => () => void leave().catch(() => {}).finally(next)

  if (!snapshot || !view) {
    return (
      <section className="status-screen" role="status">
        <h2>{error ?? '경기장에 입장하는 중…'}</h2>
        {error && <PrimaryButton onClick={() => void refresh()}>다시 시도</PrimaryButton>}
      </section>
    )
  }

  switch (view.status) {
    case 'waiting':
      return (
        <InviteWaitingScreen
          code={snapshot.match.inviteCode ?? ''}
          secondsLeft={secondsUntil(snapshot.match.expiresAt, now)}
          onCancel={leaveTo(onLobby)}
        />
      )
    case 'setting':
      return (
        <SecretSetupScreen
          me={view.me}
          opponent={view.opponent}
          secondsLeft={secondsUntil(snapshot.match.settingDeadline, now)}
          onSubmit={setSecret}
          onLeave={leaveTo(onLobby)}
          error={error}
        />
      )
    case 'playing':
      return (
        <VersusGameScreen
          view={view}
          activeSeat={snapshot.match.currentSeat}
          onPitch={submitGuess}
          onLeave={leaveTo(onLobby)}
          error={error}
        />
      )
    case 'finished':
      return <VersusResultScreen view={view} endReason={snapshot.match.endReason} onRematch={onLobby} onHome={onHome} />
    case 'expired':
      return (
        <section className="status-screen">
          <h2>경기가 취소됐어요</h2>
          <p>
            {snapshot.match.mode === 'invite' && snapshot.players.length < 2
              ? '초대 코드가 만료됐거나 방이 닫혔어요.'
              : '상대가 나갔거나 시간 안에 비밀 숫자를 정하지 않았어요.'}
          </p>
          <PrimaryButton onClick={onLobby}>대전 로비로</PrimaryButton>
          <TextButton onClick={onHome}>홈으로</TextButton>
        </section>
      )
  }
}
