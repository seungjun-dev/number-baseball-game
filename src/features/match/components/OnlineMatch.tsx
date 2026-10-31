import { useEffect, useState } from 'react'
import { toUserMessage } from '../../../lib/supabase'
import type { MatchService } from '../api/types'
import { useMatchmaking } from '../hooks/useMatchmaking'
import { MatchRoom } from './MatchRoom'
import { SearchingScreen } from './SearchingScreen'
import { VersusLobby } from './VersusLobby'

type Props = { service: MatchService; userId: string; onExit: () => void }

/** 1:1 대전 진입점: 이어하기 확인 → 로비(랜덤/초대) → 경기 */
export function OnlineMatch({ service, userId, onExit }: Props) {
  // undefined = 진행 중인 경기 확인 중
  const [matchId, setMatchId] = useState<string | null | undefined>(undefined)
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const matchmaking = useMatchmaking(service, userId)

  useEffect(() => {
    let cancelled = false
    service
      .getActiveMatch()
      .catch(() => null)
      .then((id) => {
        if (!cancelled) setMatchId(id)
      })
    return () => {
      cancelled = true
    }
  }, [service])

  const activeMatchId = matchId ?? (matchmaking.state.status === 'matched' ? matchmaking.state.matchId : null)

  const runLobbyAction = async (action: () => Promise<string>) => {
    setBusy(true)
    setLobbyError(null)
    try {
      setMatchId(await action())
    } catch (error) {
      setLobbyError(toUserMessage(error))
    } finally {
      setBusy(false)
    }
  }
  const createInvite = () => runLobbyAction(async () => (await service.createInvite()).matchId)
  const backToLobby = () => {
    matchmaking.cancel()
    setMatchId(null)
  }

  if (matchId === undefined) {
    return (
      <section className="status-screen" role="status">
        <h2>대전 정보를 확인하는 중…</h2>
      </section>
    )
  }
  if (activeMatchId) {
    return <MatchRoom key={activeMatchId} service={service} matchId={activeMatchId} userId={userId} onLobby={backToLobby} onHome={onExit} />
  }
  if (matchmaking.state.status === 'searching') {
    return (
      <SearchingScreen
        startedAt={matchmaking.state.startedAt}
        onCancel={matchmaking.cancel}
        onSwitchToInvite={() => {
          matchmaking.cancel()
          void createInvite()
        }}
      />
    )
  }
  return (
    <VersusLobby
      onRandom={matchmaking.start}
      onCreateInvite={createInvite}
      onJoin={(code) => runLobbyAction(() => service.joinInvite(code))}
      onBack={onExit}
      error={lobbyError ?? (matchmaking.state.status === 'error' ? matchmaking.state.message : null)}
      busy={busy}
    />
  )
}
