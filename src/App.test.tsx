import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('홈에서 싱글 플레이로 들어가고, 경기 나가기로 돌아온다', async () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /오늘의 라인업은/ })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /싱글 플레이/ }))
    expect(screen.getByRole('button', { name: '투구' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /경기 나가기/ }))
    expect(screen.getByRole('heading', { name: /오늘의 라인업은/ })).toBeInTheDocument()
  })

  it('워드마크를 누르면 홈으로 돌아간다', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /싱글 플레이/ }))
    await userEvent.click(screen.getByRole('button', { name: '홈으로' }))
    expect(screen.getByRole('heading', { name: /오늘의 라인업은/ })).toBeInTheDocument()
  })

  it('테마 토글로 라이트/다크 시안을 전환한다', async () => {
    const { container } = render(<App />)
    const shell = container.querySelector('.concept-shell')!
    expect(shell).toHaveClass('editorial')
    await userEvent.click(screen.getByRole('button', { name: '다크 모드로 전환' }))
    expect(shell).toHaveClass('broadcast')
    expect(screen.getByText('LIVE BROADCAST')).toBeInTheDocument()
  })

  it('로그인, 1:1 대전 UI는 노출하지 않는다', () => {
    render(<App />)
    expect(screen.queryByText(/로그인|대전/)).not.toBeInTheDocument()
  })
})
