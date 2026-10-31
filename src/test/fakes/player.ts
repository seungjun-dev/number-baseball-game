import type { PlayerRepository, Profile } from '../../features/player'

/** 메모리에서 동작하는 PlayerRepository (테스트용) */
export function createFakePlayerRepository(initial: Profile | null = null, userId = 'user-1') {
  let profile = initial
  const repo: PlayerRepository = {
    ensureSession: vi.fn(async () => userId),
    getProfile: vi.fn(async () => profile),
    createProfile: vi.fn(async (id, input) => (profile = { id, ...input })),
    updateProfile: vi.fn(async (id, input) => (profile = { id, ...input })),
  }
  return repo
}
