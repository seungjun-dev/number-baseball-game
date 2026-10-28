export type ThemeMode = 'light' | 'dark'

/** 테마별 시안 클래스 (light: 미니멀 에디토리얼, dark: 라이브 중계) */
export const THEME_CLASS: Record<ThemeMode, string> = {
  light: 'editorial',
  dark: 'broadcast',
}
