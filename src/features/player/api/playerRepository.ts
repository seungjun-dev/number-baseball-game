import { unwrap, type AppSupabaseClient } from '../../../lib/supabase'

export type Profile = { id: string; nickname: string; avatar: string }
export type ProfileInput = { nickname: string; avatar: string }

export interface PlayerRepository {
  /** 세션이 없으면 익명 로그인하고 user id를 돌려준다. */
  ensureSession(): Promise<string>
  getProfile(userId: string): Promise<Profile | null>
  createProfile(userId: string, input: ProfileInput): Promise<Profile>
  updateProfile(userId: string, input: ProfileInput): Promise<Profile>
}

const COLUMNS = 'id, nickname, avatar'

export function createPlayerRepository(client: AppSupabaseClient): PlayerRepository {
  // 동시에 여러 번 호출돼도(StrictMode 이중 effect 등) 익명 계정이 하나만 생기도록 진행 중인 요청을 공유
  let pendingSession: Promise<string> | null = null

  const ensureSessionOnce = async (): Promise<string> => {
    const current = await client.auth.getSession()
    if (current.error) throw current.error
    if (current.data.session) return current.data.session.user.id
    const signedIn = await client.auth.signInAnonymously()
    if (signedIn.error) throw signedIn.error
    if (!signedIn.data.user) throw new Error('not_authenticated')
    return signedIn.data.user.id
  }

  return {
    ensureSession() {
      pendingSession ??= ensureSessionOnce().finally(() => {
        pendingSession = null
      })
      return pendingSession
    },
    async getProfile(userId) {
      const { data, error } = await client.from('profiles').select(COLUMNS).eq('id', userId).maybeSingle()
      if (error) throw error
      return data
    },
    async createProfile(userId, input) {
      return unwrap(await client.from('profiles').insert({ id: userId, ...input }).select(COLUMNS).single())
    },
    async updateProfile(userId, input) {
      return unwrap(await client.from('profiles').update(input).eq('id', userId).select(COLUMNS).single())
    },
  }
}
