import { useState, type FormEvent } from 'react'
import { PrimaryButton, TextField } from '../../../components'
import { toUserMessage } from '../../../lib/supabase'
import type { ProfileInput } from '../api/playerRepository'
import { AVATARS, NICKNAME_MAX, validateNickname } from '../logic/nickname'
import { AvatarPicker } from './AvatarPicker'

type Props = {
  initial?: ProfileInput
  submitLabel: string
  onSubmit: (input: ProfileInput) => Promise<void>
}

/** 닉네임 + 아바타 입력 폼 (플레이어 만들기 / 프로필 수정 공용) */
export function PlayerForm({ initial, submitLabel, onSubmit }: Props) {
  const [nickname, setNickname] = useState(initial?.nickname ?? '')
  const [avatar, setAvatar] = useState<string>(initial?.avatar ?? AVATARS[0])
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const nicknameError = validateNickname(nickname)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (nicknameError || submitting) return
    setSubmitting(true)
    setServerError(null)
    try {
      await onSubmit({ nickname, avatar })
    } catch (error) {
      setServerError(toUserMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <form className="player-form" onSubmit={submit} noValidate>
      <TextField
        label="닉네임"
        placeholder="2~12자"
        maxLength={NICKNAME_MAX + 4}
        autoComplete="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        onBlur={() => setTouched(true)}
        hint={touched ? nicknameError : null}
      />
      <span className="field-label">아바타</span>
      <AvatarPicker value={avatar} onChange={setAvatar} />
      {serverError && (
        <p className="form-error" role="alert">
          {serverError}
        </p>
      )}
      <PrimaryButton type="submit" icon="↗" disabled={submitting}>
        {submitting ? '저장 중…' : submitLabel}
      </PrimaryButton>
    </form>
  )
}
