import type { ComponentProps } from 'react'

/** L2 surface: 1px border, light-mode shadow only. */
export function Card({ className = '', ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={`rounded-lg border border-border bg-surface [[data-theme=light]_&]:shadow-[0_1px_2px_rgb(16_24_40/.06)] ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className = '', ...props }: ComponentProps<'h2'>) {
  return <h2 className={`font-display text-base/6 font-semibold ${className}`} {...props} />
}
