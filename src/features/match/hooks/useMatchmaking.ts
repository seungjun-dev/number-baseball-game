import { useEffect, useRef, useState } from 'react'
import { toUserMessage } from '../../../lib/supabase'
import type { MatchService } from '../api/types'

export const HEARTBEAT_MS = 5000

export type MatchmakingState =
  | { status: 'idle' }
  | { status: 'searching'; startedAt: number }
  | { status: 'matched'; matchId: string }
  | { status: 'error'; message: string }

/**
 * 랜덤 매칭. 시작하면 Realtime 으로 내 경기 배정을 구독(준비될 때까지 대기)한 뒤 대기열에 들어가고,
 * HEARTBEAT_MS 마다 다시 호출해 접속을 알린다. 알림을 놓쳐도 heartbeat 응답으로 매칭을 감지한다.
 */
export function useMatchmaking(service: MatchService, userId: string) {
  const [state, setState] = useState<MatchmakingState>({ status: 'idle' })
  const searching = state.status === 'searching'
  const cleanupRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!searching) return
    let stopped = false
    let timer: number | undefined
    const matched = (matchId: string) => {
      if (stopped) return
      stopped = true
      setState({ status: 'matched', matchId })
    }

    const subscription = service.subscribeMyMatches(userId, matched)
    const beat = async () => {
      try {
        const matchId = await service.enqueueRandom()
        if (matchId) matched(matchId)
        else if (!stopped) timer = window.setTimeout(() => void beat(), HEARTBEAT_MS)
      } catch (error) {
        if (!stopped) {
          stopped = true
          setState({ status: 'error', message: toUserMessage(error) })
        }
      }
    }
    void subscription.ready.then(() => {
      if (!stopped) void beat()
    })

    const cleanup = () => {
      stopped = true
      window.clearTimeout(timer)
      subscription.unsubscribe()
    }
    cleanupRef.current = cleanup
    return cleanup
  }, [searching, service, userId])

  const start = () => setState({ status: 'searching', startedAt: Date.now() })

  const cancel = () => {
    cleanupRef.current()
    setState({ status: 'idle' })
    void service.cancelMatchmaking().catch(() => {})
  }

  return { state, start, cancel }
}
