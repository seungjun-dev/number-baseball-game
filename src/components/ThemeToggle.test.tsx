import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('현재 모드에 맞는 라벨을 보여주고 클릭 시 onToggle을 호출한다', async () => {
    const onToggle = vi.fn()
    const { rerender } = render(<ThemeToggle mode="light" onToggle={onToggle} />)
    await userEvent.click(screen.getByRole('button', { name: '다크 모드로 전환' }))
    expect(onToggle).toHaveBeenCalledOnce()

    rerender(<ThemeToggle mode="dark" onToggle={onToggle} />)
    expect(screen.getByRole('button', { name: '라이트 모드로 전환' })).toHaveTextContent('다크모드')
  })
})
