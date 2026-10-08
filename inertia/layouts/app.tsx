import type { ReactNode } from 'react'
import AppShell from '~/layouts/app_shell'

/**
 * Legacy import path. New pages should import ~/layouts/app_shell directly.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>
}
