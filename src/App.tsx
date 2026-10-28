import { useState } from 'react'
import { AppFooter, AppHeader, ThemeToggle } from './components'
import { SinglePlayGame } from './features/game'
import { HomeScreen } from './features/home'
import { THEME_CLASS, type ThemeMode } from './types/theme'

type Screen = 'home' | 'single'

const FOOTER_CAPTION: Record<ThemeMode, string> = {
  light: 'MINIMAL EDITORIAL',
  dark: 'LIVE BROADCAST',
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [screen, setScreen] = useState<Screen>('home')
  const goHome = () => setScreen('home')

  return (
    <main className={`concept-shell ${THEME_CLASS[theme]}`}>
      <AppHeader
        onHome={goHome}
        actions={<ThemeToggle mode={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />}
      />
      {screen === 'home' && <HomeScreen onStartSingle={() => setScreen('single')} />}
      {screen === 'single' && <SinglePlayGame onExit={goHome} />}
      <AppFooter caption={FOOTER_CAPTION[theme]} />
    </main>
  )
}

export default App
