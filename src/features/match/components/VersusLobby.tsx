import { useState, type FormEvent } from 'react'
import { Eyebrow, PrimaryButton, TextButton, TextField } from '../../../components'
import { ModeCard } from '../../home'

type Props = {
  onRandom: () => void
  onCreateInvite: () => Promise<void>
  onJoin: (code: string) => Promise<void>
  onBack: () => void
  error: string | null
  busy: boolean
}

const CODE_LENGTH = 6

export function VersusLobby({ onRandom, onCreateInvite, onJoin, onBack, error, busy }: Props) {
  const [code, setCode] = useState('')
  const join = (e: FormEvent) => {
    e.preventDefault()
    if (code.length === CODE_LENGTH && !busy) void onJoin(code)
  }

  return (
    <section className="home-screen">
      <Eyebrow>VERSUS / 1:1</Eyebrow>
      <h1>
        오늘의 상대는
        <br />
        <em>누구일까요?</em>
      </h1>
      <div className="mode-cards">
        <ModeCard
          index="01 — RANDOM"
          emoji="🎲"
          title="랜덤 매칭"
          description="지금 접속한 누군가와 바로 승부"
          cta="FIND MATCH ↗"
          onSelect={onRandom}
        />
        <ModeCard
          index="02 — INVITE"
          emoji="✉️"
          title="초대 코드 만들기"
          description="친구에게 코드를 보내 한 판"
          cta="CREATE ROOM ↗"
          onSelect={() => void onCreateInvite()}
        />
      </div>
      <form className="join-form" onSubmit={join}>
        <TextField
          label="초대 코드로 참가"
          placeholder="6자리 코드"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={CODE_LENGTH}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        />
        <PrimaryButton type="submit" disabled={code.length !== CODE_LENGTH || busy}>
          참가
        </PrimaryButton>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="tip-line">✦ &nbsp; 서로 비밀 숫자를 정하고 번갈아 맞혀요. 턴마다 30초, 각자 9번까지!</div>
      <TextButton onClick={onBack}>← &nbsp; 홈으로</TextButton>
    </section>
  )
}
