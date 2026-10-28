import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_PITCH_TIMING as T } from '../hooks/useSinglePlayGame'
import { SinglePlayGame } from './SinglePlayGame'

describe('SinglePlayGame', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  const user = () => userEvent.setup({ delay: null })

  const pitch = async (u: ReturnType<typeof user>, guess: string) => {
    await u.tripleClick(screen.getByLabelText('숫자 1'))
    await u.keyboard(guess)
    await u.click(screen.getByRole('button', { name: '투구' }))
  }

  it('규칙의 연습 게임대로 진행하면 승리 화면이 나온다 (정답 3647)', async () => {
    const u = user()
    render(<SinglePlayGame createAnswer={() => '3647'} onExit={vi.fn()} />)
    expect(screen.getByText('첫 투구를 기다리는 중')).toBeInTheDocument()

    for (const guess of ['1234', '5678', '1290', '4637']) {
      await pitch(u, guess)
      act(() => void vi.advanceTimersByTime(T.idle))
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('2 BALL · 2 STRIKES!')

    await pitch(u, '3647')
    act(() => void vi.advanceTimersByTime(T.call))
    expect(screen.getByRole('status')).toHaveTextContent('정답!')
    act(() => void vi.advanceTimersByTime(T.finish - T.call))

    expect(screen.getByRole('heading', { name: /NICE/ })).toBeInTheDocument()
    expect(screen.getByText(/정답 숫자/)).toHaveTextContent('3 · 6 · 4 · 7')
    expect(screen.getByText(/5회 도전/)).toBeInTheDocument()
  })

  it('아웃이면 OUT! 콜을 보여준다', async () => {
    const u = user()
    render(<SinglePlayGame createAnswer={() => '3647'} onExit={vi.fn()} />)
    await pitch(u, '1290')
    act(() => void vi.advanceTimersByTime(T.call))
    expect(screen.getByRole('status')).toHaveTextContent('OUT!')
  })

  it('기회를 다 쓰면 GOOD GAME 화면이 나오고, 한 판 더 하면 새 경기가 시작된다', async () => {
    const u = user()
    render(<SinglePlayGame createAnswer={() => '3647'} maxAttempts={1} onExit={vi.fn()} />)
    await pitch(u, '1234')
    act(() => void vi.advanceTimersByTime(T.finish))
    expect(screen.getByRole('heading', { name: /GOOD/ })).toBeInTheDocument()

    await u.click(screen.getByRole('button', { name: /한 판 더 하기/ }))
    expect(screen.getByText('첫 투구를 기다리는 중')).toBeInTheDocument()
    expect(screen.getByLabelText('숫자 1')).toHaveValue('')
  })

  it('경기 나가기를 누르면 onExit을 호출한다', async () => {
    const onExit = vi.fn()
    render(<SinglePlayGame onExit={onExit} />)
    await user().click(screen.getByRole('button', { name: /경기 나가기/ }))
    expect(onExit).toHaveBeenCalledOnce()
  })
})
