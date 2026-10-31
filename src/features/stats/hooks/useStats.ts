import { useEffect, useState } from 'react'
import { toUserMessage } from '../../../lib/supabase'
import type { StatsRepository } from '../api/statsRepository'
import type { PlayerStats, RecentMatch } from '../logic/stats'

export type StatsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; stats: PlayerStats; recent: RecentMatch[] }

export function useStats(repository: StatsRepository, userId: string) {
  const [state, setState] = useState<StatsState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    Promise.all([repository.getStats(), repository.getRecentMatches(userId)])
      .then(([stats, recent]): StatsState => ({ status: 'ready', stats, recent }))
      .catch((error: unknown): StatsState => ({ status: 'error', message: toUserMessage(error) }))
      .then((next) => {
        if (!cancelled) setState(next)
      })
    return () => {
      cancelled = true
    }
  }, [repository, userId])

  return state
}
