import { useEffect, useState } from 'react'
import { toast, Toaster } from 'sonner'
import { router, usePage } from '@inertiajs/react'
import { CircleAlert, CircleCheck } from 'lucide-react'

export default function FlashToasts() {
  const { flash } = usePage()
  const [position, setPosition] = useState<'bottom-right' | 'bottom-center'>('bottom-right')

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setPosition(mq.matches ? 'bottom-center' : 'bottom-right')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    return router.on('start', () => toast.dismiss('flash'))
  }, [])

  useEffect(() => {
    if (flash.error) toast.error(flash.error, { id: 'flash', duration: Infinity })
    if (flash.success) toast.success(flash.success, { id: 'flash', duration: 5000 })
  }, [flash])

  return (
    <Toaster
      position={position}
      toastOptions={{ unstyled: true }}
      icons={{
        success: <CircleCheck size={18} strokeWidth={1.8} />,
        error: <CircleAlert size={18} strokeWidth={1.8} />,
      }}
    />
  )
}
