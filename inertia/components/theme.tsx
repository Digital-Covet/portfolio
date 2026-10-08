import { useCallback, useEffect, useState } from 'react'
import { usePage } from '@inertiajs/react'

export type Theme = 'light' | 'dark' | 'system'

const COOKIE = 'app_theme'
const ONE_YEAR = 60 * 60 * 24 * 365

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system' || typeof window === 'undefined') return theme === 'system' ? 'dark' : theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark')
  document.cookie = `${COOKIE}=${theme}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const page = usePage()
  const initial = (page.props.preferences?.theme as Theme) ?? 'dark'
  const [theme, setTheme] = useState<Theme>(initial)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  return [theme, setTheme]
}

export function useSetThemeOnMount() {
  const page = usePage()
  useEffect(() => {
    const t = (page.props.preferences?.theme as Theme) ?? 'dark'
    document.documentElement.classList.toggle('dark', resolveTheme(t) === 'dark')
  }, [page.props.preferences?.theme])
}

export function ThemeCycleButton() {
  const [theme, setTheme] = useTheme()
  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])
  const isDark = resolveTheme(theme) === 'dark'
  return (
    <button
      type="button"
      className="iconbtn"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? '☾' : '☀'}
    </button>
  )
}
