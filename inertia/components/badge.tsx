import { CircleCheck, CircleX, Clock, Info, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const TONES: Record<Tone, { cls: string; icon: LucideIcon | null }> = {
  success: { cls: 'bg-success/10 text-success', icon: CircleCheck },
  warning: { cls: 'bg-warning/10 text-warning', icon: Clock },
  error: { cls: 'bg-error/10 text-error', icon: CircleX },
  info: { cls: 'bg-info/10 text-info', icon: Info },
  neutral: { cls: 'bg-secondary text-foreground', icon: null },
}

type BadgeProps = {
  tone?: Tone
  /** Override the default status icon for the tone. */
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

/** Status badge. Always icon + label so state never relies on hue alone. */
export function Badge({ tone = 'neutral', icon, children, className = '' }: BadgeProps) {
  const t = TONES[tone]
  const Icon = icon ?? t.icon
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium ${t.cls} ${className}`}
    >
      {Icon && <Icon size={14} strokeWidth={1.75} aria-hidden />}
      {children}
    </span>
  )
}
