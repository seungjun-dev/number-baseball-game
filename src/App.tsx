import { useState } from 'react'
import { getDefaultServices, type AppServices } from './app/services'
import { AppFooter, AppHeader, PrimaryButton, TextButton, ThemeToggle } from './components'
import { SinglePlayGame } from './features/game'
import { HomeScreen } from './features/home'
import { PlayerSetupScreen, ProfileChip, usePlayer } from './features/player'
import { THEME_CLASS, type ThemeMode } from './types/theme'

type Screen = 'home' | 'single'

const FOOTER_CAPTION: Record<ThemeMode, string> = {
  light: 'MINIMAL EDITORIAL',
  dark: 'LIVE BROADCAST',
}

function App({ services: injected }: { services?: AppServices }) {
  const services = injected ?? getDefaultServices()
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [screen, setScreen] = useState<Screen>('home')
  const [offlineMode, setOfflineMode] = useState(false)
  const { state: player, saveProfile, retry } = usePlayer(services.player)
  const goHome = () => setScreen('home')

  const renderBody = () => {
    if (!offlineMode && player.status === 'loading') {
      return (
        <section className="status-screen" role="status">
          <h2>구장에 입장하는 중…</h2>
        </section>
      )
    }
    if (!offlineMode && player.status === 'error') {
      return (
        <section className="status-screen">
          <h2>서버에 연결하지 못했어요</h2>
          <p>{player.message}</p>
          <PrimaryButton onClick={retry}>다시 시도</PrimaryButton>
          <TextButton onClick={() => setOfflineMode(true)}>오프라인으로 싱글 플레이</TextButton>
        </section>
      )
    }
    if (!offlineMode && player.status === 'needs-profile') {
      return <PlayerSetupScreen onCreate={saveProfile} />
    }
    if (screen === 'single') return <SinglePlayGame onExit={goHome} />
    return <HomeScreen onStartSingle={() => setScreen('single')} />
  }

  return (
    <main className={`concept-shell ${THEME_CLASS[theme]}`}>
      <AppHeader
        onHome={goHome}
        actions={
          <div className="header-actions">
            <ThemeToggle mode={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
            {player.status === 'ready' && <ProfileChip profile={player.profile} onClick={goHome} />}
          </div>
        }
      />
      {renderBody()}
      <AppFooter caption={FOOTER_CAPTION[theme]} />
    </main>
  )
}

export default App
