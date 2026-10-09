import { useState } from 'react'
import { usePage } from '@inertiajs/react'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { Monitor, Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

const OPTIONS = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
  { value: 'system', label: 'System theme', icon: Monitor },
] as const

function apply(theme: Theme) {
  const resolved =
    theme === 'system'
      ? matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : theme
  document.documentElement.setAttribute('data-theme', resolved)
  document.cookie = `app_theme=${theme}; path=/; max-age=31536000; samesite=lax`
}

export default function ThemeToggle() {
  const { preferences } = usePage().props
  const [theme, setTheme] = useState<Theme>(preferences.theme)

  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={(next) => {
        const value = next[0] as Theme | undefined
        if (!value) return
        setTheme(value)
        apply(value)
      }}
      aria-label="Theme"
      className="flex rounded-md border border-border p-0.5"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <Toggle
          key={value}
          value={value}
          aria-label={label}
          className="flex size-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground data-[pressed]:bg-secondary data-[pressed]:text-foreground"
        >
          <Icon size={16} strokeWidth={1.75} aria-hidden />
        </Toggle>
      ))}
    </ToggleGroup>
  )
}
