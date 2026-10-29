export type SupabaseConfig = { url: string; publishableKey: string }

type Env = Partial<Record<'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY', string>>

/** 환경변수에서 Supabase 접속 정보를 읽는다. 값이 없으면 null (온라인 기능 비활성). */
export function readSupabaseConfig(env: Env): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim()
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !publishableKey) return null
  return { url, publishableKey }
}
