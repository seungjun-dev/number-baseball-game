/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 안드로이드 WebView(file:// 또는 로컬 에셋)에서 로드될 수 있도록 상대 경로로 빌드
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    // .env.local 의 서버 설정을 무시하고 테스트는 항상 오프라인 기준으로 실행 (서버 연동은 서비스 주입으로 테스트)
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
})
