import { useSinglePlayGame, type SinglePlayOptions } from '../hooks/useSinglePlayGame'
import { GameScreen } from './GameScreen'
import { ResultScreen } from './ResultScreen'

type Props = SinglePlayOptions & { onExit: () => void }

/** 싱글 플레이 한 경기를 담당한다: 경기 화면 → 결과 화면 → (한 판 더) */
export function SinglePlayGame({ onExit, ...options }: Props) {
  const { game, phase, finished, canPitch, lastGuess, pitch, restart } = useSinglePlayGame(options)

  if (finished) {
    return (
      <ResultScreen
        won={game.status === 'won'}
        answer={game.answer}
        guesses={game.guesses}
        onReplay={restart}
        onHome={onExit}
      />
    )
  }

  return (
    <GameScreen
      guesses={game.guesses}
      maxAttempts={game.maxAttempts}
      phase={phase}
      canPitch={canPitch}
      lastGuess={lastGuess}
      onPitch={pitch}
      onLeave={onExit}
    />
  )
}
