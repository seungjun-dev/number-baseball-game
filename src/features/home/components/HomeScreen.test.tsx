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

  it('서버 연결이 없으면(onStartVersus 없음) 1:1 대전을 노출하지 않는다', () => {
    render(<HomeScreen onStartSingle={vi.fn()} />)
    expect(screen.queryByText('1:1 대전')).not.toBeInTheDocument()
  })

  it('onStartVersus 가 있으면 1:1 대전 카드를 보여준다', async () => {
    const onStartVersus = vi.fn()
    render(<HomeScreen onStartSingle={vi.fn()} onStartVersus={onStartVersus} />)
    await userEvent.click(screen.getByRole('button', { name: /1:1 대전/ }))
    expect(onStartVersus).toHaveBeenCalledOnce()
  })
})
