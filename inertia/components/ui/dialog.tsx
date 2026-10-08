import type { ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { cn, withClass } from '~/components/ui/cn'

/**
 * Centered dialog primitives on the design-system tokens.
 * Anatomy: Root > Portal > Backdrop + Viewport > Popup > Title + Description.
 * `DialogPopup` includes the required `Viewport` so call sites don't repeat it.
 * For side sheets / lightboxes / palettes pass a custom `className`.
 */
export { Dialog }

export function DialogBackdrop(props: Dialog.Backdrop.Props) {
  const { className, ...rest } = props
  return (
    <Dialog.Backdrop
      data-slot="dialog-backdrop"
      className={withClass('cs-scrim', className)}
      {...rest}
    />
  )
}

export function DialogPopup({
  className,
  children,
  ...rest
}: Dialog.Popup.Props & { children?: ReactNode }) {
  return (
    <Dialog.Viewport data-slot="dialog-viewport">
      <Dialog.Popup
        data-slot="dialog-popup"
        data-base-ui-popup
        className={withClass('cs-dialog', className)}
        {...rest}
      >
        {children}
      </Dialog.Popup>
    </Dialog.Viewport>
  )
}

export function DialogTitle(props: Dialog.Title.Props) {
  const { className, ...rest } = props
  return (
    <Dialog.Title
      data-slot="dialog-title"
      className={withClass('cs-dialog__title', className)}
      {...rest}
    />
  )
}

export function DialogDescription(props: Dialog.Description.Props) {
  const { className, ...rest } = props
  return (
    <Dialog.Description
      data-slot="dialog-description"
      className={withClass('cs-dialog__body', className)}
      {...rest}
    />
  )
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="cs-dialog__actions">{children}</div>
}

export { cn }
