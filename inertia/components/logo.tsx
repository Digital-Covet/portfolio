type LogoProps = { size?: number; className?: string }

/** Logo mark: a framed square with one crop-mark tick, in the brand primary. */
export function LogoMark({ size = 24, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--primary)" />
      <path
        d="M8 8h5a3 3 0 0 1 0 6H8"
        stroke="var(--primary-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M17 3v3M21 7h-3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function Logo({
  size = 24,
  collapsed = false,
  stacked = false,
}: LogoProps & { collapsed?: boolean; stacked?: boolean }) {
  return (
    <div className="flex h-14 items-center gap-2.5 px-4">
      <LogoMark size={size} className="shrink-0" />
      {!collapsed && (
        <div
          className={
            stacked ? 'flex min-w-0 flex-col leading-tight' : 'flex min-w-0 items-baseline gap-2'
          }
        >
          <span className="whitespace-nowrap font-display text-base font-semibold tracking-tight">
            Digital Covet
          </span>
          <span className="text-xs text-muted-foreground">Portfolio</span>
        </div>
      )}
    </div>
  )
}
