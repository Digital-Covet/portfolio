import { useEffect } from 'react'
import { usePage } from '@inertiajs/react'
import { Toaster, toast } from 'sonner'

/** Bridges server flash messages (success / error) into toasts, bottom-right. */
export default function FlashToasts() {
  const { flash } = usePage()

  useEffect(() => {
    if (flash?.success) toast.success(flash.success)
    if (flash?.error) toast.error(flash.error)
  }, [flash])

  return (
    <Toaster
      position="bottom-right"
      duration={5000}
      toastOptions={{
        style: {
          background: 'var(--surface-raised)',
          color: 'var(--foreground)',
          border: '1px solid var(--border-raised)',
          boxShadow: 'var(--shadow-raised)',
        },
      }}
    />
  )
}
