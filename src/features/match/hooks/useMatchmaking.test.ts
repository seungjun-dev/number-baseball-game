import { act, renderHook, waitFor } from '@testing-library/react'
import { createFakeMatchService } from '../../../test/fakes/match'
import { HEARTBEAT_MS, useMatchmaking } from './useMatchmaking'

describe('useMatchmaking', () => {
  afterEach(() => vi.useRealTimers())

  it('구독 준비 후 대기열에 들어가고 heartbeat 를 반복한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fake = createFakeMatchService()
    const { result } = renderHook(() => useMatchmaking(fake.service, 'me'))
    act(() => result.current.start())
    await waitFor(() => expect(fake.service.enqueueRandom).toHaveBeenCalledTimes(1))
    expect(fake.service.subscribeMyMatches).toHaveBeenCalledWith('me', expect.any(Function))

    await act(() => vi.advanceTimersByTimeAsync(HEARTBEAT_MS))
    expect(fake.service.enqueueRandom).toHaveBeenCalledTimes(2)
    expect(result.current.state.status).toBe('searching')
  })

  it('Realtime 알림으로 매칭되면 matched', async () => {
    const fake = createFakeMatchService()
    const { result } = renderHook(() => useMatchmaking(fake.service, 'me'))
    act(() => result.current.start())
    await waitFor(() => expect(fake.service.enqueueRandom).toHaveBeenCalled())
    act(() => fake.matched('m9'))
    expect(result.current.state).toEqual({ status: 'matched', matchId: 'm9' })
  })

  it('heartbeat 응답으로도 매칭을 감지한다 (알림을 놓친 경우)', async () => {
    const fake = createFakeMatchService()
    fake.service.enqueueRandom.mockResolvedValueOnce('m7')
    const { result } = renderHook(() => useMatchmaking(fake.service, 'me'))
    act(() => result.current.start())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'matched', matchId: 'm7' }))
  })

  it('취소하면 대기열에서 빠지고 구독을 끊는다', async () => {
    const fake = createFakeMatchService()
    const { result } = renderHook(() => useMatchmaking(fake.service, 'me'))
    act(() => result.current.start())
    await waitFor(() => expect(fake.service.enqueueRandom).toHaveBeenCalled())
    act(() => result.current.cancel())
    expect(result.current.state.status).toBe('idle')
    expect(fake.service.cancelMatchmaking).toHaveBeenCalled()
  })
})
