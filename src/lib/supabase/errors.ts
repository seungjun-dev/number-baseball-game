/** 서버(RPC)가 돌려주는 에러 코드 → 사용자 안내 문구 */
const MESSAGES: Record<string, string> = {
  not_authenticated: '로그인 정보가 없어요. 앱을 다시 열어 주세요.',
  profile_required: '플레이어를 먼저 만들어 주세요.',
  already_in_match: '이미 진행 중인 경기가 있어요.',
  invite_not_found: '초대 코드를 찾을 수 없어요. 코드를 확인해 주세요.',
  cannot_join_own_match: '내가 만든 방에는 참가할 수 없어요.',
  match_not_found: '경기를 찾을 수 없어요.',
  invalid_status: '지금은 할 수 없는 동작이에요.',
  invalid_number: '서로 다른 숫자 4개를 입력해 주세요.',
  secret_already_set: '비밀 숫자는 이미 정했어요.',
  not_your_turn: '상대 차례예요.',
  invalid_attempts: '기록을 저장할 수 없어요.',
}

const FALLBACK = '잠시 후 다시 시도해 주세요.'

/** Supabase/네트워크 에러를 화면에 보여줄 한국어 문구로 바꾼다. */
export function toUserMessage(error: unknown): string {
  const message = typeof error === 'object' && error && 'message' in error ? String(error.message) : ''
  if (MESSAGES[message]) return MESSAGES[message]
  if (/fetch|network/i.test(message)) return '서버에 연결할 수 없어요. 네트워크를 확인해 주세요.'
  return FALLBACK
}

/** supabase-js 응답에서 에러가 있으면 던지고 data를 돌려준다. */
export function unwrap<T>({ data, error }: { data: T | null; error: unknown }): T {
  if (error) throw error
  if (data === null) throw new Error('empty_response')
  return data
}
