import type { ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import { withClass } from '~/components/ui/cn'

export { Menu }

export function MenuPositioner({
  side = 'bottom',
  align = 'end',
  sideOffset = 6,
  ...rest
}: Menu.Positioner.Props) {
  return <Menu.Positioner side={side} align={align} sideOffset={sideOffset} {...rest} />
}

export function MenuPopup({
  className,
  children,
  ...rest
}: Menu.Popup.Props & { children?: ReactNode }) {
  return (
    <Menu.Popup data-base-ui-popup className={withClass('menu-popup', className)} {...rest}>
      {children}
    </Menu.Popup>
  )
}

export function MenuItem({ className, ...rest }: Menu.Item.Props) {
  return <Menu.Item className={withClass('menu-item', className)} {...rest} />
}
