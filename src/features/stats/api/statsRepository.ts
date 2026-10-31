import { unwrap, type AppSupabaseClient } from '../../../lib/supabase'
import { outcomeFor, type PlayerStats, type RecentMatch } from '../logic/stats'

export interface StatsRepository {
  getStats(userId?: string): Promise<PlayerStats>
  getRecentMatches(userId: string, limit?: number): Promise<RecentMatch[]>
  recordSoloGame(result: { attempts: number; won: boolean }): Promise<void>
}

export function createStatsRepository(client: AppSupabaseClient): StatsRepository {
  return {
    async getStats(userId) {
      const [row] = unwrap(await client.rpc('get_player_stats', userId ? { p_user_id: userId } : {}))
      return {
        onlinePlayed: row.online_played,
        onlineWins: row.online_wins,
        onlineLosses: row.online_losses,
        onlineDraws: row.online_draws,
        soloPlayed: row.solo_played,
        soloWins: row.solo_wins,
        soloBestAttempts: row.solo_best_attempts,
      }
    },

    async getRecentMatches(userId, limit = 10) {
      // RLS 로 내가 참가한 경기만 조회된다
      const matches = unwrap(
        await client
          .from('matches')
          .select('id, finished_at, winner_seat, end_reason, match_players(seat, user_id)')
          .eq('status', 'finished')
          .order('finished_at', { ascending: false })
          .limit(limit),
      )
      const opponentIds = new Set<string>()
      for (const m of matches) for (const p of m.match_players) if (p.user_id !== userId) opponentIds.add(p.user_id)
      const profiles = opponentIds.size
        ? unwrap(await client.from('profiles').select('id, nickname, avatar').in('id', [...opponentIds]))
        : []
      const byId = new Map(profiles.map((p) => [p.id, p]))

      return matches.map((m) => {
        const me = m.match_players.find((p) => p.user_id === userId)
        const opponent = m.match_players.find((p) => p.user_id !== userId)
        const profile = opponent ? byId.get(opponent.user_id) : undefined
        return {
          matchId: m.id,
          finishedAt: m.finished_at ?? '',
          outcome: outcomeFor(me?.seat ?? 0, m.winner_seat),
          endReason: m.end_reason,
          opponent: profile ? { nickname: profile.nickname, avatar: profile.avatar } : null,
        }
      })
    },

    async recordSoloGame({ attempts, won }) {
      const { error } = await client.rpc('record_solo_game', { p_attempts: attempts, p_won: won })
      if (error) throw error
    },
  }
}
