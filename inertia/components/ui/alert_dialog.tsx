import type { ReactNode } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { withClass } from '~/components/ui/cn'

/**
 * Destructive-confirm primitives. Use for deletes / irreversible actions
 * so screen readers announce urgency (AlertDialog role).
 */
export { AlertDialog }

export function AlertBackdrop(props: AlertDialog.Backdrop.Props) {
  const { className, ...rest } = props
  return <AlertDialog.Backdrop className={withClass('cs-scrim', className)} {...rest} />
}

export function AlertPopup({
  className,
  children,
  ...rest
}: AlertDialog.Popup.Props & { children?: ReactNode }) {
  return (
    <AlertDialog.Viewport>
      <AlertDialog.Popup data-base-ui-popup className={withClass('cs-dialog', className)} {...rest}>
        {children}
      </AlertDialog.Popup>
    </AlertDialog.Viewport>
  )
}

export function AlertTitle(props: AlertDialog.Title.Props) {
  const { className, ...rest } = props
  return <AlertDialog.Title className={withClass('cs-dialog__title', className)} {...rest} />
}

export function AlertDescription(props: AlertDialog.Description.Props) {
  const { className, ...rest } = props
  return <AlertDialog.Description className={withClass('cs-dialog__body', className)} {...rest} />
}

export function AlertActions({ children }: { children: ReactNode }) {
  return <div className="cs-dialog__actions">{children}</div>
}
