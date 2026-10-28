import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomeScreen } from './HomeScreen'

describe('HomeScreen', () => {
  it('싱글 플레이 카드를 누르면 게임을 시작한다', async () => {
    const onStartSingle = vi.fn()
    render(<HomeScreen onStartSingle={onStartSingle} />)
    await userEvent.click(screen.getByRole('button', { name: /싱글 플레이/ }))
    expect(onStartSingle).toHaveBeenCalledOnce()
  })

  it('1:1 대전 모드는 아직 노출하지 않는다', () => {
    render(<HomeScreen onStartSingle={vi.fn()} />)
    expect(screen.queryByText('1:1 대전')).not.toBeInTheDocument()
  })
})
