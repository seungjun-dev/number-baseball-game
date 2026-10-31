import { useLayoutEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react'

type Props = {
  /** 칸별 값 (빈 칸은 '') */
  digits: string[]
  onChange: (digits: string[]) => void
  /** 마지막 칸에서 Enter를 눌렀을 때 */
  onEnter?: () => void
  disabled?: boolean
  /** 각 칸의 접근성 라벨. 기본: "숫자 1", "숫자 2" ... */
  labelFor?: (index: number) => string
}

/** 한 칸에 숫자 하나씩 입력받는 입력 그룹. 입력하면 다음 칸으로, 빈 칸에서 Backspace면 이전 칸으로 이동한다. */
export function DigitInputGroup({ digits, onChange, onEnter, disabled, labelFor = (i) => `숫자 ${i + 1}` }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  // 리렌더 전에 입력이 연달아 들어와도(빠른 입력·모바일 IME) 최신 값을 기준으로 갱신하기 위한 ref
  const latest = useRef(digits)
  useLayoutEffect(() => {
    latest.current = digits
  }, [digits])
  const focusAt = (index: number) => refs.current[index]?.focus()

  const setDigit = (index: number, digit: string) => {
    latest.current = latest.current.map((d, i) => (i === index ? digit : d))
    onChange(latest.current)
    if (digit && index < digits.length - 1) focusAt(index + 1)
  }

  // 모바일 가상 키보드·붙여넣기 등 keydown으로 잡히지 않는 입력용
  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    setDigit(index, e.target.value.replace(/\D/g, '').slice(-1))
  }

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (/^\d$/.test(e.key)) {
      // 같은 숫자를 다시 입력하면 값이 바뀌지 않아 onChange가 오지 않으므로 직접 처리한다
      e.preventDefault()
      setDigit(index, e.key)
    } else if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault()
      latest.current = latest.current.map((d, i) => (i === index - 1 ? '' : d))
      onChange(latest.current)
      focusAt(index - 1)
    } else if (e.key === 'Enter') {
      onEnter?.()
    }
  }

  return (
    <div className="guess-controls">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          aria-label={labelFor(i)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          value={digit}
          disabled={disabled}
          onChange={handleChange(i)}
          onKeyDown={handleKeyDown(i)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  )
}
