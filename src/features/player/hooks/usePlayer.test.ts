import { act, renderHook, waitFor } from '@testing-library/react'
import { createFakePlayerRepository } from '../../../test/fakes/player'
import { usePlayer } from './usePlayer'

describe('usePlayer', () => {
  it('repository가 없으면 offline', () => {
    const { result } = renderHook(() => usePlayer(null))
    expect(result.current.state).toEqual({ status: 'offline' })
  })

  it('프로필이 없으면 needs-profile → 만들면 ready (닉네임 정리)', async () => {
    const repo = createFakePlayerRepository()
    const { result } = renderHook(() => usePlayer(repo))
    await waitFor(() => expect(result.current.state).toEqual({ status: 'needs-profile', userId: 'user-1' }))

    await act(() => result.current.saveProfile({ nickname: '  민지  ', avatar: '🧢' }))
    expect(result.current.state).toEqual({ status: 'ready', profile: { id: 'user-1', nickname: '민지', avatar: '🧢' } })
  })

  it('기존 프로필이 있으면 바로 ready, 저장하면 수정', async () => {
    const repo = createFakePlayerRepository({ id: 'user-1', nickname: '민지', avatar: '⚾' })
    const { result } = renderHook(() => usePlayer(repo))
    await waitFor(() => expect(result.current.state.status).toBe('ready'))
    await act(() => result.current.saveProfile({ nickname: '민지2', avatar: '⚾' }))
    expect(repo.updateProfile).toHaveBeenCalledWith('user-1', { nickname: '민지2', avatar: '⚾' })
  })

  it('연결에 실패하면 error, retry로 다시 시도', async () => {
    const repo = createFakePlayerRepository()
    vi.mocked(repo.ensureSession).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => usePlayer(repo))
    await waitFor(() => expect(result.current.state.status).toBe('error'))

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.state.status).toBe('needs-profile'))
  })
})
