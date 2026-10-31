export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 12

/** 고를 수 있는 아바타 */
export const AVATARS = ['⚾', '🧢', '🏏', '🧤', '🏆', '🔥', '⭐', '🐯'] as const

export const normalizeNickname = (value: string): string => value.trim().replace(/\s+/g, ' ')

/** 닉네임 규칙 검사 (서버 profiles 제약과 동일). 문제가 없으면 null. */
export function validateNickname(value: string): string | null {
  const length = [...normalizeNickname(value)].length
  if (length < NICKNAME_MIN) return `닉네임은 ${NICKNAME_MIN}자 이상이어야 해요.`
  if (length > NICKNAME_MAX) return `닉네임은 ${NICKNAME_MAX}자까지 쓸 수 있어요.`
  return null
}
