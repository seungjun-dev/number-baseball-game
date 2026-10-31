import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toUserMessage } from '../../../lib/supabase'
import type { MatchService, MatchSnapshot } from '../api/types'
import { deriveMatchView } from '../logic/matchView'

export const CLOCK_TICK_MS = 1000

/**
 * 한 경기의 실시간 상태. 변경 알림이 오면 스냅샷을 다시 받아오고(단순·견고),
 * 1초마다 시계를 갱신한다. 턴 마감이 지나면 시간 초과를 서버에 확정 요청한다.
 */
export function useMatch(service: MatchService, matchId: string, userId: string) {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const requestId = useRef(0)

  type FetchResult = { id: number; snapshot?: MatchSnapshot; error?: unknown }

  const fetchLatest = useCallback((): Promise<FetchResult> => {
    const id = ++requestId.current
    return service.fetchSnapshot(matchId).then(
      (snapshot) => ({ id, snapshot }),
      (error: unknown) => ({ id, error }),
    )
  }, [service, matchId])

  // 늦게 도착한 이전 응답이 최신 상태를 덮어쓰지 않도록 가장 최근 요청만 반영
  const commit = useCallback((result: FetchResult) => {
    if (result.id !== requestId.current) return
    if (result.snapshot) {
      setSnapshot(result.snapshot)
      setError(null)
    } else {
      setError(toUserMessage(result.error))
    }
  }, [])

  const refresh = useCallback(() => fetchLatest().then(commit), [fetchLatest, commit])

  useEffect(() => {
    const subscription = service.subscribeMatch(matchId, () => void fetchLatest().then(commit))
    void fetchLatest().then(commit)
    // 구독 준비 후 한 번 더 받아와 준비 전에 생긴 변경도 반영
    void subscription.ready.then(fetchLatest).then(commit)
    return subscription.unsubscribe
  }, [service, matchId, fetchLatest, commit])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  const view = useMemo(() => (snapshot ? deriveMatchView(snapshot, userId, now) : null), [snapshot, userId, now])

  // 턴 마감이 지나면 (턴마다 한 번) 시간 초과 확정 요청
  const claimedTurn = useRef<string | null>(null)
  const turnKey = snapshot?.match.turnStartedAt ?? null
  useEffect(() => {
    if (!view?.deadlinePassed || !turnKey || claimedTurn.current === turnKey) return
    claimedTurn.current = turnKey
    void service
      .claimTimeout(matchId)
      .then(() => refresh())
      .catch(() => {})
  }, [view?.deadlinePassed, turnKey, service, matchId, refresh])

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action()
      setError(null)
    } catch (e) {
      setError(toUserMessage(e))
      throw e
    } finally {
      await refresh()
    }
  }

  return {
    snapshot,
    view,
    error,
    now,
    refresh,
    setSecret: (secret: string) => run(() => service.setSecret(matchId, secret)),
    submitGuess: (guess: string) => run(() => service.submitGuess(matchId, guess)),
    leave: () => run(() => service.leave(matchId)),
  }
}
