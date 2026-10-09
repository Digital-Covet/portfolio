import { useId, useMemo, useState } from 'react'
import { Popover } from '@base-ui/react/popover'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export type Option = { id: string; name: string }

type Props = {
  label: string
  /** Options that can be picked right now (may be a filtered subset). */
  options: Option[]
  /** Every known option, so chips for picks outside the current filter keep their name. */
  allOptions?: Option[]
  value: string[]
  onChange: (next: string[]) => void
  error?: string
  hint?: string
  placeholder?: string
  disabled?: boolean
}

/**
 * Searchable multi-select: chips for the picks plus a popover checklist. Built on
 * Base UI Popover so focus handling and dismissal are accessible by default.
 */
export function MultiSelect({
  label,
  options,
  allOptions,
  value,
  onChange,
  error,
  hint,
  placeholder = 'Add…',
  disabled,
}: Props) {
  const id = useId()
  const [query, setQuery] = useState('')
  const names = useMemo(
    () => new Map((allOptions ?? options).map((o) => [o.id, o.name])),
    [allOptions, options]
  )
  const shown = options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()))
  const toggle = (optionId: string) =>
    onChange(value.includes(optionId) ? value.filter((v) => v !== optionId) : [...value, optionId])

  return (
    <div>
      <span id={`${id}-label`} className="mb-1.5 block text-[13px]/[18px] font-medium">
        {label}
      </span>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5" aria-labelledby={`${id}-label`}>
          {value.map((v) => (
            <li
              key={v}
              className="inline-flex h-6 items-center gap-1 rounded-full bg-secondary pl-2 pr-1 text-xs"
            >
              {names.get(v) ?? 'Unknown'}
              <button
                type="button"
                onClick={() => toggle(v)}
                aria-label={`Remove ${names.get(v) ?? 'item'}`}
                className="inline-flex size-4 items-center justify-center rounded-full hover:bg-border-strong/40"
              >
                <X size={12} strokeWidth={1.75} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Popover.Root onOpenChange={(open) => !open && setQuery('')}>
        <Popover.Trigger
          disabled={disabled}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="inline-flex h-9 w-full items-center justify-between rounded-md border border-border-strong bg-surface px-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        >
          {placeholder}
          <ChevronDown size={16} strokeWidth={1.75} aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="start" className="z-50">
            <Popover.Popup className="w-[min(320px,92vw)] rounded-lg border border-border-raised bg-surface-raised p-2 shadow-[var(--shadow-raised)]">
              <div className="relative">
                <Search
                  size={16}
                  strokeWidth={1.75}
                  className="pointer-events-none absolute left-2.5 top-2.5 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label={`Search ${label.toLowerCase()}`}
                  placeholder="Search"
                  className="h-9 w-full rounded-md border border-border-strong bg-surface pl-8 pr-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                />
              </div>
              <ul
                role="listbox"
                aria-multiselectable
                aria-label={label}
                className="mt-2 max-h-60 overflow-y-auto"
              >
                {shown.length === 0 && (
                  <li className="px-2 py-3 text-sm text-muted-foreground">No matches.</li>
                )}
                {shown.map((o) => {
                  const on = value.includes(o.id)
                  return (
                    <li key={o.id} role="option" aria-selected={on}>
                      <button
                        type="button"
                        onClick={() => toggle(o.id)}
                        className="flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-secondary"
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded-sm border ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong'}`}
                        >
                          {on && <Check size={12} strokeWidth={2.5} aria-hidden />}
                        </span>
                        {o.name}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} data-field-error className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}
