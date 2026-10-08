import { useState } from 'react'
import { router } from '@inertiajs/react'
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import { Dialog, DialogBackdrop, DialogPopup, DialogTitle } from '~/components/ui/dialog'
import {
  AlertDialog,
  AlertBackdrop,
  AlertPopup,
  AlertTitle,
  AlertDescription,
  AlertActions,
} from '~/components/ui/alert_dialog'
import type { InertiaProps } from '~/types'
import type { ClientRow, ClientsProps } from '~/components/clients/types'

type Props = InertiaProps<ClientsProps>

function ClientForm({ initial, onClose }: { initial: ClientRow | null; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? '')
  const valid = name.trim().length >= 2

  const submit = () => {
    if (!valid) return
    const data = { name: name.trim(), ...(logoUrl.trim() ? { logoUrl: logoUrl.trim() } : {}) }
    if (initial) router.put(`/clients/${initial.id}`, data, { preserveScroll: true })
    else router.post('/clients', data, { preserveScroll: true })
    onClose()
  }

  return (
    <>
      <div className="field">
        <label className="field__label" htmlFor="client-name">
          Name
        </label>
        <input
          id="client-name"
          className="field__input"
          value={name}
          maxLength={120}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label className="field__label" htmlFor="client-logo">
          Logo URL (optional)
        </label>
        <input
          id="client-logo"
          className="field__input"
          value={logoUrl}
          maxLength={2048}
          placeholder="https://…"
          onChange={(e) => setLogoUrl(e.target.value)}
        />
      </div>
      {initial && initial.keyBusinesses.length > 0 && (
        <p className="telemetry" style={{ marginTop: 12 }}>
          Linked key businesses: {initial.keyBusinesses.join(', ')}
        </p>
      )}
      <div className="cs-dialog__actions" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={!valid}
          onClick={submit}
        >
          {initial ? 'Save' : 'Add client'}
        </button>
      </div>
    </>
  )
}

export default function Clients({ clients }: Props) {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ClientRow | null>(null)
  const [deleting, setDeleting] = useState<ClientRow | null>(null)

  return (
    <Page
      title="Clients"
      description={<span className="telemetry">{clients.length} clients · admin only</span>}
      actions={
        <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
          <Plus size={16} aria-hidden />
          New client
        </button>
      }
    >
      <p className="visually-hidden" role="status" aria-live="polite">
        {clients.length} clients
      </p>

      {clients.length === 0 ? (
        <div className="empty">
          <div className="empty__patch covet-grid covet-grid--auto" aria-hidden>
            <span className="empty__icon">
              <Building2 size={24} aria-hidden />
            </span>
          </div>
          <p className="empty__title">No clients yet</p>
        </div>
      ) : (
        <div className="dash-card" style={{ overflow: 'hidden', padding: 0 }}>
          <table className="cs-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Key businesses</th>
                <th scope="col">Case studies</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt=""
                          width={28}
                          height={28}
                          style={{ borderRadius: 6, objectFit: 'cover' }}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--background)',
                            border: '1px solid var(--hairline)',
                          }}
                        >
                          <Building2 size={15} aria-hidden />
                        </span>
                      )}
                      <strong>{c.name}</strong>
                    </span>
                  </td>
                  <td className="telemetry">{c.keyBusinesses.join(', ') || '—'}</td>
                  <td className="telemetry">{c.caseStudyCount}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="iconbtn iconbtn--sm"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => setEditing(c)}
                    >
                      <Pencil size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="iconbtn iconbtn--sm"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => setDeleting(c)}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog.Root open={creating} onOpenChange={setCreating}>
        <Dialog.Portal>
          <DialogBackdrop />
          <DialogPopup aria-label="New client">
            <DialogTitle>New client</DialogTitle>
            <ClientForm initial={null} onClose={() => setCreating(false)} />
          </DialogPopup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <Dialog.Portal>
          <DialogBackdrop />
          <DialogPopup aria-label={editing ? `Edit ${editing.name}` : 'Edit client'}>
            <DialogTitle>Edit “{editing?.name}”</DialogTitle>
            {editing && <ClientForm initial={editing} onClose={() => setEditing(null)} />}
          </DialogPopup>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={deleting !== null} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialog.Portal>
          <AlertBackdrop />
          <AlertPopup aria-label={deleting ? `Delete ${deleting.name}` : 'Delete client'}>
            <AlertTitle>Delete “{deleting?.name}”?</AlertTitle>
            <AlertDescription>
              Case studies are kept and detached from this client. This cannot be undone.
            </AlertDescription>
            <AlertActions>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => {
                  if (deleting) router.delete(`/clients/${deleting.id}`, { preserveScroll: true })
                  setDeleting(null)
                }}
              >
                <Trash2 size={14} aria-hidden />
                Delete
              </button>
            </AlertActions>
          </AlertPopup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Page>
  )
}

Clients.layout = (page: React.ReactNode) => <AppShell>{page}</AppShell>
