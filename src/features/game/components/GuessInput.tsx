import { useState } from 'react'
import { DigitInputGroup, Eyebrow, PrimaryButton } from '../../../components'
import { DIGIT_COUNT, GUESS_ERROR_MESSAGES, validateGuess } from '../logic'

type Props = {
  onPitch: (guess: string) => void
  /** 투구 애니메이션 중 등 투구를 막아야 할 때 (입력칸은 그대로 두어 키보드가 닫히지 않게 한다) */
  disabled?: boolean
  length?: number
}

const emptyDigits = (length: number) => Array.from({ length }, () => '')

export function GuessInput({ onPitch, disabled = false, length = DIGIT_COUNT }: Props) {
  const [digits, setDigits] = useState(() => emptyDigits(length))
  const guess = digits.join('')
  const error = validateGuess(guess, length)
  // 칸이 덜 찼을 때는 안내하지 않고, 중복처럼 고쳐야 할 문제만 알려준다
  const hint = error && error !== 'length' ? GUESS_ERROR_MESSAGES[error] : null
  const canPitch = !disabled && error === null

  const pitch = () => {
    if (canPitch) onPitch(guess)
  }

  return (
    <div className="guess-entry">
      <Eyebrow>YOUR PITCH</Eyebrow>
      <DigitInputGroup digits={digits} onChange={setDigits} onEnter={pitch} />
      <PrimaryButton icon="↗" onClick={pitch} disabled={!canPitch}>
        투구
      </PrimaryButton>
      {hint && (
        <p className="guess-hint" role="alert">
          {hint}
        </p>
      )}
    </div>
  )
}
