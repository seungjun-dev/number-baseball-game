import { readSupabaseConfig } from './config'

describe('readSupabaseConfig', () => {
  it('URL과 키가 모두 있으면 설정을 돌려준다', () => {
    expect(
      readSupabaseConfig({ VITE_SUPABASE_URL: ' http://127.0.0.1:54321 ', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x' }),
    ).toEqual({ url: 'http://127.0.0.1:54321', publishableKey: 'sb_publishable_x' })
  })

  it.each([{}, { VITE_SUPABASE_URL: 'http://x' }, { VITE_SUPABASE_URL: 'http://x', VITE_SUPABASE_PUBLISHABLE_KEY: '  ' }])(
    '값이 빠지면 null (%o)',
    (env) => {
      expect(readSupabaseConfig(env)).toBeNull()
    },
  )
})
