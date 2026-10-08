import { Select } from '@base-ui/react/select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '~/components/ui/cn'

export { Select }

export type SelectOption = { value: string; label: string; disabled?: boolean }

/**
 * Design-system select: `field__input` trigger + `menu-popup` listbox.
 * Controlled: pass `value` + `onValueChange`. Replaces native `<select>`
 * where keyboard typeahead, highlighted styling, and popover
 * positioning matter (filter bars, dashboard controls).
 */
export function UiSelect({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'All',
  disabled,
  className,
}: {
  label: string
  value: string
  onValueChange: (v: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <Select.Root
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      disabled={disabled}
    >
      <Select.Trigger
        aria-label={label}
        className={cn('field__input cs-select__input', className)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown size={15} aria-hidden style={{ color: 'var(--fg-3)', flex: 'none' }} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner side="bottom" align="start" sideOffset={6}>
          <Select.Popup data-base-ui-popup className="menu-popup" aria-label={label}>
            <Select.List>
              {options.map((o) => (
                <Select.Item
                  key={o.value}
                  value={o.value}
                  disabled={o.disabled}
                  className="menu-item"
                >
                  <Select.ItemText style={{ flex: 1 }}>{o.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={14} aria-hidden />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
