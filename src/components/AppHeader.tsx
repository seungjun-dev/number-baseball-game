import type { ReactNode } from 'react'

type Props = { onHome: () => void; actions?: ReactNode }

export function AppHeader({ onHome, actions }: Props) {
  return (
    <header className="concept-nav">
      <button type="button" className="wordmark" onClick={onHome} aria-label="홈으로">
        <span className="logo-ball" aria-hidden="true">⚾</span> NUMBER <b>LEAGUE</b>
      </button>
      {actions}
    </header>
  )
}
