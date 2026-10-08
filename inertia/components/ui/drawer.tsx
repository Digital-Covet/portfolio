import type { ReactNode } from 'react'
import { Drawer } from '@base-ui/react/drawer'
import { withClass } from '~/components/ui/cn'

/**
 * Mobile navigation drawer (left side). Anatomy per v1.8 docs:
 * Root > Portal > Backdrop + Viewport > Popup > Content > Title.
 */
export { Drawer }

export function DrawerBackdrop(props: Drawer.Backdrop.Props) {
  const { className, ...rest } = props
  return <Drawer.Backdrop className={withClass('cs-scrim', className)} {...rest} />
}

export function NavDrawerPopup({
  className,
  children,
  ...rest
}: Drawer.Popup.Props & { children?: ReactNode }) {
  return (
    <Drawer.Viewport>
      <Drawer.Popup
        data-base-ui-popup
        aria-label="Navigation"
        className={withClass('', className)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(300px, 84vw)',
          background: 'var(--sidebar)',
          color: 'var(--sidebar-fg)',
          zIndex: 85,
          borderRight: '1px solid var(--hairline)',
        }}
        {...rest}
      >
        <Drawer.Content style={{ height: '100%' }}>{children}</Drawer.Content>
      </Drawer.Popup>
    </Drawer.Viewport>
  )
}
