import { useState } from 'react'
import { getDefaultServices, type AppServices } from './app/services'
import { AppFooter, AppHeader, PrimaryButton, TextButton, ThemeToggle } from './components'
import { SinglePlayGame, type GameState } from './features/game'
import { HomeScreen } from './features/home'
import { PlayerForm, PlayerSetupScreen, ProfileChip, usePlayer } from './features/player'
import { StatsScreen } from './features/stats'
import { THEME_CLASS, type ThemeMode } from './types/theme'

type Screen = 'home' | 'single' | 'stats'

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
  const online = !offlineMode && player.status === 'ready'
  const goHome = () => setScreen('home')

  const recordSoloGame = (game: GameState) => {
    if (!online || !services.stats) return
    // 기록 실패는 게임 진행을 막지 않는다
    services.stats
      .recordSoloGame({ attempts: game.guesses.length, won: game.status === 'won' })
      .catch((error: unknown) => console.warn('싱글 기록 저장 실패', error))
  }

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
    if (screen === 'single') return <SinglePlayGame onExit={goHome} onGameEnd={recordSoloGame} />
    if (screen === 'stats' && player.status === 'ready' && services.stats) {
      return (
        <StatsScreen
          repository={services.stats}
          player={player.profile}
          onBack={goHome}
          renderProfileEditor={(close) => (
            <PlayerForm
              initial={player.profile}
              submitLabel="저장"
              onSubmit={async (input) => {
                await saveProfile(input)
                close()
              }}
            />
          )}
        />
      )
    }
    return <HomeScreen onStartSingle={() => setScreen('single')} />
  }

  return (
    <main className={`concept-shell ${THEME_CLASS[theme]}`}>
      <AppHeader
        onHome={goHome}
        actions={
          <div className="header-actions">
            <ThemeToggle mode={theme} onToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
            {online && player.status === 'ready' && (
              <ProfileChip profile={player.profile} onClick={() => setScreen('stats')} />
            )}
          </div>
        }
      />
      {renderBody()}
      <AppFooter caption={FOOTER_CAPTION[theme]} />
    </main>
  )
}

export default App
