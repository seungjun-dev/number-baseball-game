import { TextButton } from '../../../components'
import type { GuessRecord } from '../logic'
import type { PitchPhase } from '../hooks/useSinglePlayGame'
import { GuessInput } from './GuessInput'
import { Playfield } from './Playfield'
import { Scoreboard } from './Scoreboard'

type Props = {
  guesses: GuessRecord[]
  maxAttempts: number
  phase: PitchPhase
  canPitch: boolean
  lastGuess: GuessRecord | null
  onPitch: (guess: string) => void
  onLeave: () => void
}

export function GameScreen({ guesses, maxAttempts, phase, canPitch, lastGuess, onPitch, onLeave }: Props) {
  return (
    <section className="match-screen">
      <GuessInput onPitch={onPitch} disabled={!canPitch} />
      <Playfield
        phase={phase}
        attempt={Math.min(guesses.length + 1, maxAttempts)}
        maxAttempts={maxAttempts}
        lastGuess={lastGuess}
      />
      <Scoreboard guesses={guesses} />
      <TextButton onClick={onLeave}>← &nbsp; 경기 나가기</TextButton>
    </section>
  )
}
