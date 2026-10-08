import { Moon, Sun } from 'lucide-react'
import { ThemeCycleButton } from '~/components/theme'

/**
 * Back-compat wrapper kept for existing imports.
 * New code should use useTheme() + UserMenu theme group.
 */
export default function ThemeToggle() {
  return <ThemeCycleButton />
}

export function ThemeToggleIcons({ dark }: { dark: boolean }) {
  return (
    <>
      <Sun size={16} style={{ display: dark ? 'none' : 'block' }} aria-hidden />
      <Moon size={16} style={{ display: dark ? 'block' : 'none' }} aria-hidden />
    </>
  )
}
