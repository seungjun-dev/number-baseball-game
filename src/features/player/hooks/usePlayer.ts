import { useEffect, useState } from 'react'
import { toUserMessage } from '../../../lib/supabase'
import type { PlayerRepository, ProfileInput, Profile } from '../api/playerRepository'
import { normalizeNickname } from '../logic/nickname'

export type PlayerState =
  | { status: 'offline' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'needs-profile'; userId: string }
  | { status: 'ready'; profile: Profile }

/** 세션 확보(필요하면 익명 로그인) 후 프로필 유무로 플레이어 상태를 정한다. */
async function fetchPlayerState(repository: PlayerRepository): Promise<PlayerState> {
  try {
    const userId = await repository.ensureSession()
    const profile = await repository.getProfile(userId)
    return profile ? { status: 'ready', profile } : { status: 'needs-profile', userId }
  } catch (error) {
    return { status: 'error', message: toUserMessage(error) }
  }
}

/**
 * 현재 기기의 플레이어 상태. repository가 null이면(서버 미설정) offline.
 * 첫 실행이면 익명 로그인 후 needs-profile → saveProfile 로 플레이어를 만든다.
 */
export function usePlayer(repository: PlayerRepository | null) {
  const [state, setState] = useState<PlayerState>(repository ? { status: 'loading' } : { status: 'offline' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!repository) return
    let cancelled = false
    void fetchPlayerState(repository).then((next) => {
      if (!cancelled) setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [repository, attempt])

  /** 플레이어를 만들거나(첫 실행) 수정한다. 실패하면 에러를 던진다. */
  const saveProfile = async (input: ProfileInput): Promise<void> => {
    if (!repository) return
    const normalized = { ...input, nickname: normalizeNickname(input.nickname) }
    if (state.status === 'needs-profile') {
      setState({ status: 'ready', profile: await repository.createProfile(state.userId, normalized) })
    } else if (state.status === 'ready') {
      setState({ status: 'ready', profile: await repository.updateProfile(state.profile.id, normalized) })
    }
  }

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  return { state, saveProfile, retry }
}
