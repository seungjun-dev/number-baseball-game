import type { AppSupabaseClient } from '../../../lib/supabase'
import { createPlayerRepository } from './playerRepository'

function fakeClient(session: { user: { id: string } } | null) {
  const signInAnonymously = vi.fn(
    () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: { id: 'anon-1' } }, error: null }), 10)),
  )
  const client = {
    auth: { getSession: vi.fn(async () => ({ data: { session }, error: null })), signInAnonymously },
  } as unknown as AppSupabaseClient
  return { client, signInAnonymously }
}

describe('playerRepository.ensureSession', () => {
  it('세션이 있으면 그 사용자 id를 쓴다', async () => {
    const { client, signInAnonymously } = fakeClient({ user: { id: 'me' } })
    expect(await createPlayerRepository(client).ensureSession()).toBe('me')
    expect(signInAnonymously).not.toHaveBeenCalled()
  })

  it('동시에 여러 번 불려도 익명 로그인은 한 번만 한다', async () => {
    const { client, signInAnonymously } = fakeClient(null)
    const repo = createPlayerRepository(client)
    const ids = await Promise.all([repo.ensureSession(), repo.ensureSession()])
    expect(ids).toEqual(['anon-1', 'anon-1'])
    expect(signInAnonymously).toHaveBeenCalledOnce()
  })
})
