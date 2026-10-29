import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'

let client: SupabaseClient | null | undefined

/**
 * 앱 전체에서 공유하는 Supabase 클라이언트.
 * 환경변수가 없으면 null을 돌려주므로, 싱글 플레이처럼 오프라인 기능은 서버 없이도 동작한다.
 * 화면 코드는 이 함수를 직접 부르지 말고 각 기능의 repository/service를 통해 접근한다.
 */
export function getSupabase(): SupabaseClient | null {
  if (client === undefined) {
    const config = readSupabaseConfig(import.meta.env)
    client = config ? createClient(config.url, config.publishableKey) : null
  }
  return client
}

export const isOnlineAvailable = (): boolean => getSupabase() !== null
