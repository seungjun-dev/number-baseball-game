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

describe('App — 온라인', () => {
  it('첫 실행이면 플레이어 만들기 → 홈, 헤더에 내 프로필', async () => {
    const { createFakePlayerRepository } = await import('./test/fakes/player')
    render(<App services={{ player: createFakePlayerRepository(), stats: null }} />)
    await userEvent.type(await screen.findByLabelText('닉네임'), '민지')
    await userEvent.click(screen.getByRole('button', { name: /입단하기/ }))
    expect(await screen.findByRole('heading', { name: /오늘의 라인업은/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '민지 전적 보기' })).toBeInTheDocument()
  })
})

describe('App — 전적', () => {
  it('헤더 프로필을 누르면 전적 화면, 프로필 수정이 헤더에 반영된다', async () => {
    const { createFakePlayerRepository } = await import('./test/fakes/player')
    const { createFakeStatsRepository } = await import('./test/fakes/stats')
    render(
      <App
        services={{
          player: createFakePlayerRepository({ id: 'me', nickname: '민지', avatar: '🐯' }),
          stats: createFakeStatsRepository({ onlinePlayed: 1, onlineWins: 1 }),
        }}
      />,
    )
    await userEvent.click(await screen.findByRole('button', { name: '민지 전적 보기' }))
    expect(await screen.findByText('1승 0패')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '프로필 수정' }))
    const input = screen.getByLabelText('닉네임')
    await userEvent.clear(input)
    await userEvent.type(input, '민지짱')
    await userEvent.click(screen.getByRole('button', { name: /저장/ }))
    expect(await screen.findByRole('button', { name: '민지짱 전적 보기' })).toBeInTheDocument()
  })
})
