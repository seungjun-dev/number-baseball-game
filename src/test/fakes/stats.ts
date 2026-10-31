import { EMPTY_STATS, type PlayerStats, type RecentMatch, type StatsRepository } from '../../features/stats'

export function createFakeStatsRepository(stats: Partial<PlayerStats> = {}, recent: RecentMatch[] = []) {
  const repo: StatsRepository = {
    getStats: vi.fn(async () => ({ ...EMPTY_STATS, ...stats })),
    getRecentMatches: vi.fn(async () => recent),
    recordSoloGame: vi.fn(async () => {}),
  }
  return repo
}
