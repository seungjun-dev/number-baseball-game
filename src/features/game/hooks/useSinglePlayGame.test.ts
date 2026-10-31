import { act, renderHook } from '@testing-library/react'
import { DEFAULT_PITCH_TIMING as T, useSinglePlayGame } from './useSinglePlayGame'

const setup = (options: Parameters<typeof useSinglePlayGame>[0] = {}) =>
  renderHook(() => useSinglePlayGame({ createAnswer: () => '3647', ...options }))

describe('useSinglePlayGame', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('투구하면 스윙 → 헛스윙 → 판정 → 대기 순서로 진행한다', () => {
    const { result } = setup()
    act(() => void result.current.pitch('1234'))
    expect(result.current.phase).toBe('swing')
    expect(result.current.canPitch).toBe(false)
    expect(result.current.lastGuess).toMatchObject({ value: '1234', strike: 0, ball: 2 })

    act(() => void vi.advanceTimersByTime(T.miss))
    expect(result.current.phase).toBe('miss')
    act(() => void vi.advanceTimersByTime(T.call - T.miss))
    expect(result.current.phase).toBe('call')
    act(() => void vi.advanceTimersByTime(T.idle - T.call))
    expect(result.current.phase).toBe('idle')
    expect(result.current.canPitch).toBe(true)
    expect(result.current.finished).toBe(false)
  })

  it('연출 중이거나 입력이 잘못되면 투구가 무시된다', () => {
    const { result } = setup()
    let accepted = true
    act(() => void (accepted = result.current.pitch('1123')))
    expect(accepted).toBe(false)

    act(() => void result.current.pitch('1234'))
    act(() => void (accepted = result.current.pitch('5678')))
    expect(accepted).toBe(false)
    expect(result.current.game.guesses).toHaveLength(1)
  })

  it('정답을 맞히면 victory 연출 후 경기가 끝난다', () => {
    const { result } = setup()
    act(() => void result.current.pitch('3647'))
    act(() => void vi.advanceTimersByTime(T.call))
    expect(result.current.phase).toBe('victory')
    expect(result.current.finished).toBe(false)
    act(() => void vi.advanceTimersByTime(T.finish - T.call))
    expect(result.current.finished).toBe(true)
    expect(result.current.game.status).toBe('won')
  })

  it('경기가 끝나면 onGameEnd 를 한 번 호출한다', () => {
    const onGameEnd = vi.fn()
    const { result } = setup({ onGameEnd })
    act(() => void result.current.pitch('1234'))
    act(() => void vi.advanceTimersByTime(T.idle))
    act(() => void result.current.pitch('3647'))
    expect(onGameEnd).not.toHaveBeenCalled()
    act(() => void vi.advanceTimersByTime(T.finish))
    expect(onGameEnd).toHaveBeenCalledOnce()
    expect(onGameEnd.mock.calls[0][0]).toMatchObject({ status: 'won', guesses: { length: 2 } })
  })

  it('최대 투구 수를 다 쓰면 패배로 끝난다', () => {
    const { result } = setup({ maxAttempts: 1 })
    act(() => void result.current.pitch('1234'))
    act(() => void vi.advanceTimersByTime(T.finish))
    expect(result.current.finished).toBe(true)
    expect(result.current.game.status).toBe('lost')
  })

  it('restart하면 새 정답으로 처음부터 시작하고 진행 중인 연출을 취소한다', () => {
    const answers = ['3647', '0123']
    const { result } = renderHook(() => useSinglePlayGame({ createAnswer: () => answers.shift()! }))
    act(() => void result.current.pitch('3647'))
    act(() => result.current.restart())
    act(() => void vi.advanceTimersByTime(T.finish))

    expect(result.current.game.answer).toBe('0123')
    expect(result.current.game.guesses).toHaveLength(0)
    expect(result.current.phase).toBe('idle')
    expect(result.current.finished).toBe(false)
  })
})
