import { createPlayerRepository, type PlayerRepository } from '../features/player'
import { getSupabase, type AppSupabaseClient } from '../lib/supabase'

/** 앱이 쓰는 서버 연동 모듈 모음. 서버 설정이 없으면 모두 null (오프라인). */
export type AppServices = {
  player: PlayerRepository | null
}

export function createAppServices(client: AppSupabaseClient | null = getSupabase()): AppServices {
  return {
    player: client ? createPlayerRepository(client) : null,
  }
}

let defaultServices: AppServices | undefined

/** 앱 전체에서 한 번만 만드는 기본 서비스 (리렌더·StrictMode 에도 같은 인스턴스) */
export function getDefaultServices(): AppServices {
  defaultServices ??= createAppServices()
  return defaultServices
}
