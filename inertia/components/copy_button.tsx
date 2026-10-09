import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Copies `value` to the clipboard. The icon swaps Copy → Check for 1.5s and a polite
 * live region announces the result to screen readers.
 */
export default function CopyButton({
  value,
  children,
  announce = 'Copied',
  className,
  iconOnly,
  label,
}: {
  value: string | (() => string)
  children?: ReactNode
  announce?: string
  className: string
  iconOnly?: boolean
  /** Accessible name when only the icon is visible. */
  label?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(typeof value === 'function' ? value() : value)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const Icon = copied ? Check : Copy
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={iconOnly ? label : undefined}
      className={className}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
      {!iconOnly && children}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? announce : ''}
      </span>
    </button>
  )
}
