import type { RealtimeChannel } from '@supabase/supabase-js'
import { unwrap, type AppSupabaseClient } from '../../../lib/supabase'
import type { MatchService, MatchSnapshot, Subscription } from './types'

/** 'Subscribed to PostgreSQL' 시스템 메시지를 받거나 일정 시간이 지나면 준비된 것으로 본다 */
function watchReady(channel: RealtimeChannel, fallbackMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, fallbackMs)
    channel.on('system', {}, (payload: { message?: string }) => {
      if (payload.message?.includes('Subscribed to PostgreSQL')) {
        clearTimeout(timer)
        resolve()
      }
    })
  })
}

export function createMatchService(client: AppSupabaseClient): MatchService {
  const rpcVoid = async (result: PromiseLike<{ error: unknown }>) => {
    const { error } = await result
    if (error) throw error
  }

  const subscribe = (name: string, configure: (channel: RealtimeChannel) => RealtimeChannel): Subscription => {
    const channel = configure(client.channel(`${name}:${crypto.randomUUID()}`))
    const ready = watchReady(channel)
    channel.subscribe()
    return { ready, unsubscribe: () => void client.removeChannel(channel) }
  }

  return {
    async getActiveMatch() {
      const { data, error } = await client.rpc('get_active_match')
      if (error) throw error
      return data ?? null
    },
    async createInvite() {
      const [row] = unwrap(await client.rpc('create_invite_match'))
      return { matchId: row.match_id, inviteCode: row.invite_code }
    },
    async joinInvite(code) {
      return unwrap(await client.rpc('join_invite_match', { p_code: code }))
    },
    async enqueueRandom() {
      const { data, error } = await client.rpc('enqueue_random_match')
      if (error) throw error
      return data ?? null
    },
    cancelMatchmaking: () => rpcVoid(client.rpc('cancel_matchmaking')),
    setSecret: (matchId, secret) => rpcVoid(client.rpc('set_secret', { p_match_id: matchId, p_secret: secret })),
    async submitGuess(matchId, guess) {
      const [row] = unwrap(await client.rpc('submit_guess', { p_match_id: matchId, p_guess: guess }))
      return { strike: row.strike, ball: row.ball, timedOut: row.timed_out }
    },
    async claimTimeout(matchId) {
      return unwrap(await client.rpc('claim_timeout', { p_match_id: matchId }))
    },
    leave: (matchId) => rpcVoid(client.rpc('leave_match', { p_match_id: matchId })),

    async fetchSnapshot(matchId) {
      const [m, players, guesses] = await Promise.all([
        client.from('matches').select('*').eq('id', matchId).single(),
        client.from('match_players').select('seat, user_id, ready').eq('match_id', matchId).order('seat'),
        client
          .from('guesses')
          .select('seat, turn_no, guess, strike, ball, timed_out')
          .eq('match_id', matchId)
          .order('id'),
      ])
      const match = unwrap(m)
      const playerRows = unwrap(players)
      const profiles = unwrap(
        await client
          .from('profiles')
          .select('id, nickname, avatar')
          .in(
            'id',
            playerRows.map((p) => p.user_id),
          ),
      )
      const profileById = new Map(profiles.map((p) => [p.id, p]))
      const snapshot: MatchSnapshot = {
        match: {
          id: match.id,
          mode: match.mode,
          status: match.status,
          inviteCode: match.invite_code,
          firstSeat: match.first_seat,
          currentSeat: match.current_seat,
          turnStartedAt: match.turn_started_at,
          turnSeconds: match.turn_seconds,
          maxAttempts: match.max_attempts,
          lastChance: match.last_chance,
          winnerSeat: match.winner_seat,
          endReason: match.end_reason,
          expiresAt: match.expires_at,
          settingDeadline: match.setting_deadline,
        },
        players: playerRows.map((p) => ({
          seat: p.seat,
          userId: p.user_id,
          ready: p.ready,
          nickname: profileById.get(p.user_id)?.nickname ?? '???',
          avatar: profileById.get(p.user_id)?.avatar ?? '❔',
        })),
        guesses: unwrap(guesses).map((g) => ({
          seat: g.seat,
          turnNo: g.turn_no,
          guess: g.guess,
          strike: g.strike,
          ball: g.ball,
          timedOut: g.timed_out,
        })),
      }
      return snapshot
    },

    subscribeMatch(matchId, onChange) {
      return subscribe('match', (channel) =>
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` }, onChange)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
            onChange,
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'guesses', filter: `match_id=eq.${matchId}` },
            onChange,
          ),
      )
    },

    subscribeMyMatches(userId, onMatched) {
      return subscribe('my-matches', (channel) =>
        channel.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'match_players', filter: `user_id=eq.${userId}` },
          (payload) => onMatched((payload.new as { match_id: string }).match_id),
        ),
      )
    },
  }
}
