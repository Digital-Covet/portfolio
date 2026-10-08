import type { ReactNode } from 'react'
import { useSetThemeOnMount } from '~/components/theme'

/** Mounts workspace shell side effects (theme sync from shared preferences). */
export default function ShellProviders({ children }: { children: ReactNode }) {
  useSetThemeOnMount()
  return children
}
