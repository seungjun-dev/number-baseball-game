import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerSetupScreen } from './PlayerSetupScreen'

describe('PlayerSetupScreen', () => {
  it('닉네임이 짧으면 안내하고 저장하지 않는다', async () => {
    const onCreate = vi.fn()
    render(<PlayerSetupScreen onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('닉네임'), '민')
    await userEvent.click(screen.getByRole('button', { name: /입단하기/ }))
    expect(screen.getByText(/2자 이상/)).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('닉네임과 아바타를 골라 플레이어를 만든다', async () => {
    const onCreate = vi.fn(async () => {})
    render(<PlayerSetupScreen onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('닉네임'), '민지')
    await userEvent.click(screen.getByRole('radio', { name: '아바타 🐯' }))
    expect(screen.getByRole('radio', { name: '아바타 🐯' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('button', { name: /입단하기/ }))
    expect(onCreate).toHaveBeenCalledWith({ nickname: '민지', avatar: '🐯' })
  })

  it('서버 에러를 안내한다', async () => {
    const onCreate = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    render(<PlayerSetupScreen onCreate={onCreate} />)
    await userEvent.type(screen.getByLabelText('닉네임'), '민지')
    await userEvent.click(screen.getByRole('button', { name: /입단하기/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('네트워크')
    expect(screen.getByRole('button', { name: /입단하기/ })).toBeEnabled()
  })
})
