import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { DigitInputGroup } from './DigitInputGroup'

function Harness({ onEnter }: { onEnter?: () => void }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  return (
    <>
      <DigitInputGroup digits={digits} onChange={setDigits} onEnter={onEnter} />
      <output>{digits.join('')}</output>
    </>
  )
}

const inputs = () => screen.getAllByRole('textbox')

describe('DigitInputGroup', () => {
  it('숫자를 입력하면 다음 칸으로 이동한다', async () => {
    render(<Harness />)
    await userEvent.click(inputs()[0])
    await userEvent.keyboard('1234')
    expect(screen.getByRole('status')).toHaveTextContent('1234')
    expect(inputs()[3]).toHaveFocus()
  })

  it('숫자가 아닌 입력은 무시한다', async () => {
    render(<Harness />)
    await userEvent.type(inputs()[0], 'a')
    expect(inputs()[0]).toHaveValue('')
  })

  it('빈 칸에서 Backspace를 누르면 이전 칸을 지우고 이동한다', async () => {
    render(<Harness />)
    await userEvent.click(inputs()[0])
    await userEvent.keyboard('12')
    await userEvent.keyboard('{Backspace}')
    expect(inputs()[1]).toHaveFocus()
    expect(inputs()[1]).toHaveValue('')
    expect(inputs()[0]).toHaveValue('1')
  })

  it('Enter를 누르면 onEnter를 호출한다', async () => {
    const onEnter = vi.fn()
    render(<Harness onEnter={onEnter} />)
    await userEvent.type(inputs()[0], '{Enter}')
    expect(onEnter).toHaveBeenCalledOnce()
  })
})

describe('DigitInputGroup — 이미 채워진 칸', () => {
  it('같은 숫자로 덮어써도 다음 칸으로 이동한다', async () => {
    render(<Harness />)
    await userEvent.click(inputs()[0])
    await userEvent.keyboard('1234')
    await userEvent.click(inputs()[0])
    await userEvent.keyboard('1')
    expect(inputs()[1]).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('1234')
  })
})
