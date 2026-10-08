import { Tabs } from '@base-ui/react/tabs'
import { withClass } from '~/components/ui/cn'

export { Tabs }

/**
 * Segmented tab trigger styled like the existing `.cs-tab` pills.
 * Base UI `Tabs.Tab` already exposes `data-active`, matching the
 * legacy `.cs-tab[data-active]` CSS — no manual mapping needed.
 */
export function PillTab({
  value,
  className,
  children,
  ...rest
}: Tabs.Tab.Props & { value: string }) {
  return (
    <Tabs.Tab value={value} className={withClass('cs-tab', className)} {...rest}>
      {children}
    </Tabs.Tab>
  )
}
