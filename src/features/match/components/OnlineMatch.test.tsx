import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createFakeMatchService, makeSnapshot } from '../../../test/fakes/match'
import { OnlineMatch } from './OnlineMatch'

const renderMatch = (fake: ReturnType<typeof createFakeMatchService>) =>
  render(<OnlineMatch service={fake.service} userId="me" onExit={vi.fn()} />)

describe('OnlineMatch', () => {
  it('초대 코드로 참가하면 비밀 숫자 설정 화면 → 확정 → 상대 대기', async () => {
    const fake = createFakeMatchService(makeSnapshot({ status: 'setting', firstSeat: null, currentSeat: null, turnStartedAt: null }, {
      players: [
        { seat: 1, userId: 'opp', ready: false, nickname: '비버', avatar: '🧢' },
        { seat: 2, userId: 'me', ready: false, nickname: '민지', avatar: '🐯' },
      ],
    }))
    renderMatch(fake)
    await userEvent.type(await screen.findByLabelText('초대 코드로 참가'), 'abc234')
    await userEvent.click(screen.getByRole('button', { name: '참가' }))
    expect(fake.service.joinInvite).toHaveBeenCalledWith('ABC234')

    await userEvent.click(await screen.findByLabelText('비밀 숫자 1'))
    await userEvent.keyboard('1123')
    expect(screen.getByRole('button', { name: /비밀 숫자 확정/ })).toBeDisabled()
    await userEvent.click(screen.getByLabelText('비밀 숫자 1'))
    await userEvent.keyboard('3647')

    fake.service.setSecret.mockImplementationOnce(async () => {
      fake.setSnapshot(makeSnapshot({ status: 'setting', firstSeat: null, currentSeat: null, turnStartedAt: null }, {
        players: [
          { seat: 1, userId: 'opp', ready: false, nickname: '비버', avatar: '🧢' },
          { seat: 2, userId: 'me', ready: true, nickname: '민지', avatar: '🐯' },
        ],
      }))
    })
    await userEvent.click(screen.getByRole('button', { name: /비밀 숫자 확정/ }))
    expect(fake.service.setSecret).toHaveBeenCalledWith('m1', '3647')
    expect(await screen.findByText('숫자를 정했어요!')).toBeInTheDocument()
  })

  it('진행 중인 경기가 있으면 바로 이어한다', async () => {
    const fake = createFakeMatchService()
    fake.service.getActiveMatch.mockResolvedValueOnce('m1')
    renderMatch(fake)
    expect(await screen.findByText('내 차례! 상대 숫자를 맞혀보세요')).toBeInTheDocument()
  })

  it('경기 중: 내 차례에만 투구, 상대 투구가 실시간으로 반영된다', async () => {
    const fake = createFakeMatchService()
    fake.service.getActiveMatch.mockResolvedValueOnce('m1')
    renderMatch(fake)
    await screen.findByText('내 차례! 상대 숫자를 맞혀보세요')

    await userEvent.click(screen.getByLabelText('숫자 1'))
    await userEvent.keyboard('1234')
    fake.service.submitGuess.mockImplementationOnce(async () => {
      fake.setSnapshot(makeSnapshot({ currentSeat: 2 }, {
        guesses: [{ seat: 1, turnNo: 1, guess: '1234', strike: 0, ball: 2, timedOut: false }],
      }))
      return { strike: 0, ball: 2, timedOut: false }
    })
    await userEvent.click(screen.getByRole('button', { name: '투구' }))
    expect(fake.service.submitGuess).toHaveBeenCalledWith('m1', '1234')
    expect(await screen.findByText('상대가 생각하는 중…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '투구' })).toBeDisabled()
    expect(screen.getByText('내 투구 1 / 9')).toBeInTheDocument()

    // 상대가 투구 → Realtime 알림 → 다시 내 차례
    fake.setSnapshot(makeSnapshot({ currentSeat: 1, lastChance: true }, {
      guesses: [
        { seat: 1, turnNo: 1, guess: '1234', strike: 0, ball: 2, timedOut: false },
        { seat: 2, turnNo: 1, guess: '5678', strike: 4, ball: 0, timedOut: false },
      ],
    }))
    act(() => fake.emit())
    expect(await screen.findByText('마지막 기회! 맞히면 무승부예요')).toBeInTheDocument()
    expect(screen.getByText('상대 투구 1 / 9')).toBeInTheDocument()
  })

  it('경기 결과 화면', async () => {
    const fake = createFakeMatchService(makeSnapshot({ status: 'finished', winnerSeat: 1, endReason: 'solved', currentSeat: null }))
    fake.service.getActiveMatch.mockResolvedValueOnce('m1')
    renderMatch(fake)
    expect(await screen.findByRole('heading', { name: /YOU\s*WIN!/ })).toBeInTheDocument()
    expect(screen.getByText('정답')).toBeInTheDocument()
  })

  it('경기 나가기는 한 번 더 확인한다 (기권패)', async () => {
    const fake = createFakeMatchService()
    fake.service.getActiveMatch.mockResolvedValueOnce('m1')
    renderMatch(fake)
    await userEvent.click(await screen.findByRole('button', { name: /경기 나가기/ }))
    expect(fake.service.leave).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: '기권하고 나가기' }))
    expect(fake.service.leave).toHaveBeenCalledWith('m1')
  })

  it('턴 마감이 지나면 시간 초과를 서버에 확정 요청한다', async () => {
    const fake = createFakeMatchService(makeSnapshot({ turnStartedAt: new Date(Date.now() - 40_000).toISOString(), currentSeat: 2 }))
    fake.service.getActiveMatch.mockResolvedValueOnce('m1')
    renderMatch(fake)
    await screen.findByText('상대가 생각하는 중…')
    await vi.waitFor(() => expect(fake.service.claimTimeout).toHaveBeenCalledWith('m1'))
    expect(fake.service.claimTimeout).toHaveBeenCalledTimes(1)
  })
})
