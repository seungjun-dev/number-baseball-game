import type { ThemeMode } from '../types/theme'

type Props = { mode: ThemeMode; onToggle: () => void }

export function ThemeToggle({ mode, onToggle }: Props) {
  const isDark = mode === 'dark'
  return (
    <div className="theme-control">
      <button
        type="button"
        className={isDark ? 'is-dark' : ''}
        onClick={onToggle}
        aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      >
        <i />
        {isDark ? '다크모드' : '라이트모드'}
      </button>
    </div>
  )
}
