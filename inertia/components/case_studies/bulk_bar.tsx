import { router } from '@inertiajs/react'
import { Archive, Link2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

/** Slides up when ≥1 row is selected. Delete is admin-gated server-side. */
export default function BulkBar({
  count,
  ids,
  onDone,
}: {
  count: number
  ids: string[]
  onDone: () => void
}) {
  if (count === 0) return null

  const archive = () => {
    router.patch(
      '/case-studies/bulk',
      { ids, status: 'archived' },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`${count} case ${count === 1 ? 'study' : 'studies'} archived`)
          onDone()
        },
        onError: () => toast.error('Bulk archive failed. Try again.'),
      }
    )
  }

  const destroy = () => {
    router.delete('/case-studies/bulk', {
      data: { ids },
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`${count} case ${count === 1 ? 'study' : 'studies'} deleted`)
        onDone()
      },
      onError: () => toast.error('Bulk delete failed. Try again.'),
    })
  }

  return (
    <div className="cs-bulkbar" role="toolbar" aria-label="Bulk actions">
      <span className="telemetry cs-bulkbar__count">{count} selected</span>
      <a href={`/shares/new?caseStudies=${ids.join(',')}`} className="btn btn--outline btn--sm">
        <Link2 size={14} aria-hidden />
        Add to share
      </a>
      <button type="button" className="btn btn--outline btn--sm" onClick={archive}>
        <Archive size={14} aria-hidden />
        Archive
      </button>
      <button
        type="button"
        className="btn btn--outline btn--sm cs-bulkbar__danger"
        onClick={destroy}
      >
        <Trash2 size={14} aria-hidden />
        Delete
      </button>
    </div>
  )
}
