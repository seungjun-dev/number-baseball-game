import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuessInput } from './GuessInput'

const typeGuess = async (value: string) => {
  await userEvent.click(screen.getByLabelText('숫자 1'))
  await userEvent.keyboard(value)
}

describe('GuessInput', () => {
  it('4자리를 모두 채우기 전에는 투구할 수 없다', async () => {
    render(<GuessInput onPitch={vi.fn()} />)
    await typeGuess('123')
    expect(screen.getByRole('button', { name: '투구' })).toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('중복 숫자가 있으면 안내하고 투구를 막는다', async () => {
    render(<GuessInput onPitch={vi.fn()} />)
    await typeGuess('1123')
    expect(screen.getByRole('alert')).toHaveTextContent('같은 숫자는 한 번만')
    expect(screen.getByRole('button', { name: '투구' })).toBeDisabled()
  })

  it('버튼 또는 Enter로 투구한다', async () => {
    const onPitch = vi.fn()
    render(<GuessInput onPitch={onPitch} />)
    await typeGuess('1234')
    await userEvent.click(screen.getByRole('button', { name: '투구' }))
    await userEvent.keyboard('{Enter}')
    expect(onPitch).toHaveBeenCalledTimes(2)
    expect(onPitch).toHaveBeenCalledWith('1234')
  })

  it('disabled면 입력은 가능하지만 투구는 막힌다', async () => {
    const onPitch = vi.fn()
    render(<GuessInput onPitch={onPitch} disabled />)
    await typeGuess('1234{Enter}')
    expect(screen.getByLabelText('숫자 4')).toHaveValue('4')
    expect(screen.getByRole('button', { name: '투구' })).toBeDisabled()
    expect(onPitch).not.toHaveBeenCalled()
  })
})
