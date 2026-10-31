import { useState } from 'react'
import { Eyebrow, PrimaryButton, TextButton } from '../../../components'
import { formatClock } from '../logic/matchView'

type Props = { code: string; secondsLeft: number; onCancel: () => void }

export function InviteWaitingScreen({ code, secondsLeft, onCancel }: Props) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  return (
    <section className="status-screen">
      <Eyebrow>INVITE CODE</Eyebrow>
      <div className="invite-code" aria-label={`초대 코드 ${code}`}>
        {code}
      </div>
      <h2>친구가 들어오길 기다리는 중…</h2>
      <p>친구에게 코드를 알려주세요. {formatClock(secondsLeft)} 후 만료돼요.</p>
      <PrimaryButton onClick={() => void copy()}>{copied ? '복사했어요 ✓' : '코드 복사'}</PrimaryButton>
      <TextButton onClick={onCancel}>방 닫기</TextButton>
    </section>
  )
}
