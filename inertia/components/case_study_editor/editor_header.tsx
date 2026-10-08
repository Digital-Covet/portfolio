import { Link } from '@adonisjs/inertia/react'
import { Eye, MoreHorizontal, Save, SendHorizontal } from 'lucide-react'
import { StatusBadge } from '~/components/dashboard/widgets'
import type { EditorMode, EditorStatus, SaveState } from './types'

/**
 * Sticky editor header replacing PageHeader: breadcrumb + status badge +
 * save state telemetry + Preview / Save draft / Publish actions.
 */
export default function EditorHeader({
  mode,
  id,
  title,
  status,
  saveState,
  savedLabel,
  uploading,
  onSave,
  onPublish,
  onRetry,
  crumbs,
}: {
  mode: EditorMode
  id: string | null
  title: string
  status: EditorStatus
  saveState: SaveState
  savedLabel: string
  uploading: boolean
  onSave: () => void
  onPublish: () => void
  onRetry: () => void
  crumbs: { label: string; href?: string }
}) {
  const published = status === 'published'
  const busy = saveState === 'saving' || uploading

  return (
    <div className="cse-header">
      <div className="cse-header__left">
        <nav aria-label="Breadcrumb" className="cse-crumb">
          <Link href="/case-studies" className="cse-crumb__link">
            Case studies
          </Link>
          <span aria-hidden="true" className="cse-crumb__sep">
            /
          </span>
          <span aria-current="page" className="cse-crumb__current">
            {title.trim() || crumbs.label}
          </span>
        </nav>
        <div className="cse-header__meta">
          <StatusBadge status={status} />
          {saveState === 'saved' && (
            <span className="telemetry cse-save" data-tone="saved">
              Saved {savedLabel}
            </span>
          )}
          {saveState === 'dirty' && (
            <span className="cse-save" data-tone="dirty">
              Unsaved changes
            </span>
          )}
          {saveState === 'saving' && (
            <span className="telemetry cse-save" data-tone="saving">
              Saving…
            </span>
          )}
          {saveState === 'error' && (
            <span className="cse-save" data-tone="error">
              Couldn&apos;t save{' '}
              <button type="button" className="dash-link" onClick={onRetry}>
                Retry
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="cse-header__actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={uploading}
          title={uploading ? 'Uploads in progress' : 'Preview'}
        >
          <Eye size={15} aria-hidden />
          Preview
        </button>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={onSave}
          disabled={busy}
          title={uploading ? 'Uploads in progress' : mode === 'new' ? 'Save draft' : 'Save changes'}
        >
          <Save size={15} aria-hidden />
          {published ? 'Save changes' : mode === 'new' ? 'Save draft' : 'Save changes'}
        </button>
        {!published && (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={onPublish}
            disabled={busy}
            title={uploading ? 'Uploads in progress' : 'Publish'}
          >
            <SendHorizontal size={15} aria-hidden />
            Publish
          </button>
        )}
        <button
          type="button"
          className="iconbtn iconbtn--sm"
          aria-label={id ? `More actions for ${title || 'case study'}` : 'More actions'}
          title="More actions"
        >
          <MoreHorizontal size={16} aria-hidden />
        </button>
      </div>
    </div>
  )
}
