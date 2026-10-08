import { useEffect, useState } from 'react'
import { router } from '@inertiajs/react'

/**
 * Inertia navigation progress: 2px primary bar, shown only after 120ms
 * so fast visits don't flash. Status, not decoration — kept under
 * reduced motion.
 */
export default function NavProgress() {
  const [on, setOn] = useState(false)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const offStart = router.on('start', () => {
      t = setTimeout(() => setOn(true), 120)
    })
    const done = () => {
      if (t) clearTimeout(t)
      setOn(false)
    }
    const offFinish = router.on('finish', done)
    return () => {
      if (t) clearTimeout(t)
      offStart()
      offFinish()
    }
  }, [])

  return <div className="nav-progress" data-on={on ? 'true' : 'false'} aria-hidden="true" />
}
