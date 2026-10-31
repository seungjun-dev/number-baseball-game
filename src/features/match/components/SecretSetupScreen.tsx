import { useState } from 'react'
import { DigitInputGroup, Eyebrow, PrimaryButton, TextButton } from '../../../components'
import { DIGIT_COUNT, GUESS_ERROR_MESSAGES, validateGuess } from '../../game'
import { formatClock, type PlayerView } from '../logic/matchView'
import { VersusHeader } from './VersusHeader'

type Props = {
  me: PlayerView | null
  opponent: PlayerView | null
  secondsLeft: number
  onSubmit: (secret: string) => Promise<void>
  onLeave: () => void
  error: string | null
}

export function SecretSetupScreen({ me, opponent, secondsLeft, onSubmit, onLeave, error }: Props) {
  const [digits, setDigits] = useState(() => Array.from({ length: DIGIT_COUNT }, () => ''))
  const [busy, setBusy] = useState(false)
  const secret = digits.join('')
  const invalid = validateGuess(secret)
  const hint = invalid && invalid !== 'length' ? GUESS_ERROR_MESSAGES[invalid] : null

  const submit = async () => {
    if (invalid || busy) return
    setBusy(true)
    try {
      await onSubmit(secret)
    } catch {
      setBusy(false)
    }
  }

  return (
    <section className="match-screen">
      <VersusHeader me={me} opponent={opponent} showReady />
      <div className="secret-box">
        <Eyebrow>SECRET NUMBER · {formatClock(secondsLeft)}</Eyebrow>
        {me?.ready ? (
          <>
            <h2>숫자를 정했어요!</h2>
            <p>상대가 비밀 숫자를 정하는 중이에요…</p>
          </>
        ) : (
          <>
            <h2>상대가 맞힐 비밀 숫자를 정하세요</h2>
            <p>서로 다른 숫자 4개. 한 번 정하면 바꿀 수 없어요.</p>
            <DigitInputGroup digits={digits} onChange={setDigits} onEnter={() => void submit()} labelFor={(i) => `비밀 숫자 ${i + 1}`} />
            {hint && (
              <p className="guess-hint" role="alert">
                {hint}
              </p>
            )}
            <PrimaryButton icon="↗" onClick={() => void submit()} disabled={invalid !== null || busy}>
              비밀 숫자 확정
            </PrimaryButton>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <TextButton onClick={onLeave}>← &nbsp; 경기 취소</TextButton>
    </section>
  )
}
