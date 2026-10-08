import type { ReactNode } from 'react'
import { Popover } from '@base-ui/react/popover'
import { withClass } from '~/components/ui/cn'

export { Popover }

export function PopoverPositioner({
  side = 'bottom',
  align = 'end',
  sideOffset = 8,
  ...rest
}: Popover.Positioner.Props) {
  return <Popover.Positioner side={side} align={align} sideOffset={sideOffset} {...rest} />
}

export function PopoverPopup({
  className,
  children,
  ...rest
}: Popover.Popup.Props & { children?: ReactNode }) {
  return (
    <Popover.Popup data-base-ui-popup className={withClass('menu-popup', className)} {...rest}>
      {children}
    </Popover.Popup>
  )
}
