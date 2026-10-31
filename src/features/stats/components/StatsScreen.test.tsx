import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakeStatsRepository } from '../../../test/fakes/stats'
import { StatsScreen } from './StatsScreen'

const player = { id: 'me', nickname: '민지', avatar: '🐯' }

describe('StatsScreen', () => {
  it('대전/싱글 전적과 최근 경기를 보여준다', async () => {
    const repo = createFakeStatsRepository(
      { onlinePlayed: 3, onlineWins: 2, onlineLosses: 1, soloPlayed: 4, soloWins: 3, soloBestAttempts: 5 },
      [
        {
          matchId: 'm1',
          finishedAt: '2026-10-31T10:00:00',
          outcome: 'win',
          endReason: 'solved',
          opponent: { nickname: '비버', avatar: '🧢' },
        },
      ],
    )
    render(<StatsScreen repository={repo} player={player} renderProfileEditor={() => null} onBack={vi.fn()} />)

    expect(await screen.findByText('2승 1패')).toBeInTheDocument()
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('5회')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('비버')
    expect(screen.getByRole('listitem')).toHaveTextContent('WIN · 정답')
  })

  it('기록이 없으면 빈 상태 안내', async () => {
    render(
      <StatsScreen repository={createFakeStatsRepository()} player={player} renderProfileEditor={() => null} onBack={vi.fn()} />,
    )
    expect(await screen.findByText('아직 온라인 대전 기록이 없어요')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.getByText('0판 · 승률 —')).toBeInTheDocument()
  })

  it('프로필 수정 영역을 열고 닫는다', async () => {
    render(
      <StatsScreen
        repository={createFakeStatsRepository()}
        player={player}
        renderProfileEditor={() => <p>편집기</p>}
        onBack={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: '프로필 수정' }))
    expect(screen.getByText('편집기')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(screen.queryByText('편집기')).not.toBeInTheDocument()
  })
})
