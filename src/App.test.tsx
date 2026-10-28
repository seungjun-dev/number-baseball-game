import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('타이틀을 렌더링한다', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: '숫자야구' })).toBeInTheDocument()
  })
})
