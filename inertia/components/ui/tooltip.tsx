import type { ReactNode } from 'react'
import { Tooltip } from '@base-ui/react/tooltip'
import { withClass } from '~/components/ui/cn'

export { Tooltip }

export function TooltipPopup({
  className,
  children,
  ...rest
}: Tooltip.Popup.Props & { children?: ReactNode }) {
  return (
    <Tooltip.Popup data-base-ui-popup className={withClass('tx-tooltip', className)} {...rest}>
      {children}
    </Tooltip.Popup>
  )
}
