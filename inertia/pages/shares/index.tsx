import { useEffect, useMemo, useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { Meter } from '@base-ui/react/meter'
import { Tabs } from '@base-ui/react/tabs'
import { Ban, Copy, Ellipsis, Info, Lock, Pencil, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, type Tone } from '~/components/badge'
import { Card } from '~/components/card'
import CopyButton from '~/components/copy_button'
import RevokeDialog from '~/components/revoke_share_dialog'
import Page from '~/components/page'
import AppLayout from '~/layouts/app'
import {
  passwordHandoff,
  relativeTime,
  shareUrl,
  shortDate,
  shortToken,
  type ShareState,
} from '~/lib/share'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type ShareRow = {
  id: string
  name: string
  token: string
  state: ShareState
  protected: boolean
  type: 'pinned' | 'rule'
  studies: number
  views: number
  maxViews: number | null
  expiresAt: string | null
  owner: string
}

/** Mirrors the props sent by app/controllers/shares_controller.ts. */
type SharesProps = {
  shares: ShareRow[]
  created: { id: string; name: string; token: string; protected: boolean } | null
}

type TabValue = 'all' | 'active' | 'expiring' | 'expired' | 'limit'

const primaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50'
const secondaryBtn =
  'inline-flex h-9 items-center gap-2 rounded-md bg-secondary px-3 text-sm font-medium transition-colors hover:bg-secondary/70'
const inputCls =
  'h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm placeholder:text-muted-foreground'
const tabCls =
  'relative inline-flex h-10 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[selected]:text-foreground'
const menuItemCls =
  'flex h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-sm outline-none data-[highlighted]:bg-secondary'
const dialogPopupCls =
  'fixed left-1/2 top-1/2 z-50 flex max-h-[min(90svh,720px)] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-lg border border-border-raised bg-surface-raised p-6 shadow-[var(--shadow-raised)] transition-[opacity,transform] duration-[180ms] data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0 motion-reduce:transition-none'
const backdropCls =
  'fixed inset-0 z-40 bg-black/50 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0'

const STATE_BADGE: Record<ShareState, { tone: Tone; label: string }> = {
  active: { tone: 'success', label: 'Active' },
  expiring: { tone: 'warning', label: 'Expiring' },
  expired: { tone: 'error', label: 'Expired' },
  limit: { tone: 'error', label: 'Limit reached' },
}

/** Tabs show links that work under "Active"; "Expiring" is the subset ending within 7 days. */
const TABS: { value: TabValue; label: string; match: (s: ShareRow) => boolean }[] = [
  { value: 'all', label: 'All', match: () => true },
  {
    value: 'active',
    label: 'Active',
    match: (s) => s.state === 'active' || s.state === 'expiring',
  },
  { value: 'expiring', label: 'Expiring', match: (s) => s.state === 'expiring' },
  { value: 'expired', label: 'Expired', match: (s) => s.state === 'expired' },
  { value: 'limit', label: 'Limit reached', match: (s) => s.state === 'limit' },
]

/* -------------------------------------------------------------------------- */
/* Cells                                                                       */
/* -------------------------------------------------------------------------- */

function ViewsMeter({ share }: { share: ShareRow }) {
  if (share.maxViews === null) {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {share.views} <span className="text-muted-foreground/80">· no cap</span>
      </span>
    )
  }
  const pct = Math.min(Math.round((share.views / share.maxViews) * 100), 100)
  return (
    <div className="flex items-center gap-2">
      <Meter.Root
        value={pct}
        aria-label={`${share.views} of ${share.maxViews} views used`}
        className="w-16"
      >
        <Meter.Track className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <Meter.Indicator
            className={`h-full rounded-full ${share.state === 'limit' ? 'bg-error' : 'bg-primary'}`}
          />
        </Meter.Track>
      </Meter.Root>
      <span className="font-mono text-xs text-muted-foreground">
        {share.views}/{share.maxViews}
      </span>
    </div>
  )
}

function Expiry({ share }: { share: ShareRow }) {
  if (!share.expiresAt) return <span className="text-muted-foreground">No expiry</span>
  return (
    <span
      title={shortDate(share.expiresAt)}
      className={share.state === 'expiring' ? 'font-medium text-warning' : 'text-muted-foreground'}
    >
      {share.state === 'expired' ? 'Expired ' : ''}
      {relativeTime(share.expiresAt)}
    </span>
  )
}

function RowMenu({ share, onRevoke }: { share: ShareRow; onRevoke: (s: ShareRow) => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(share.token))
      toast.success('Link copied')
    } catch {
      toast.error('Couldn’t copy the link. Copy it from the edit page instead.')
    }
  }
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Actions for ${share.name}`}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground data-[popup-open]:bg-secondary"
      >
        <Ellipsis size={16} strokeWidth={1.75} aria-hidden />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
          <Menu.Popup className="min-w-44 rounded-lg border border-border-raised bg-surface-raised p-1 shadow-[var(--shadow-raised)]">
            <Menu.Item className={menuItemCls} onClick={copy}>
              <Copy size={16} strokeWidth={1.75} aria-hidden /> Copy link
            </Menu.Item>
            <Menu.Item
              className={menuItemCls}
              onClick={() => router.visit(`/shares/${share.id}/edit`)}
            >
              <Pencil size={16} strokeWidth={1.75} aria-hidden /> Edit
            </Menu.Item>
            <Menu.Separator className="my-1 h-px bg-border-raised" />
            <Menu.Item className={`${menuItemCls} text-error`} onClick={() => onRevoke(share)}>
              <Ban size={16} strokeWidth={1.75} aria-hidden /> Revoke
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Table                                                                        */
/* -------------------------------------------------------------------------- */

function SharesTable({ rows, onRevoke }: { rows: ShareRow[]; onRevoke: (s: ShareRow) => void }) {
  const th = 'h-10 px-4 text-left text-xs font-medium text-muted-foreground'
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[13px]/[18px]">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={th}>
              Share
            </th>
            <th scope="col" className={`${th} max-lg:hidden`}>
              Link
            </th>
            <th scope="col" className={th}>
              Type
            </th>
            <th scope="col" className={th}>
              Views
            </th>
            <th scope="col" className={th}>
              Expires
            </th>
            <th scope="col" className={`${th} max-lg:hidden`}>
              Owner
            </th>
            <th scope="col" className="w-12 px-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const badge = STATE_BADGE[s.state]
            return (
              <tr
                key={s.id}
                className="h-14 border-b border-border last:border-b-0 hover:bg-secondary/50"
              >
                <td className="px-4">
                  <div className="flex flex-col items-start gap-1">
                    <Link
                      href={`/shares/${s.id}`}
                      className="flex items-center gap-1.5 rounded-sm font-medium hover:underline"
                    >
                      {s.name}
                      {s.protected && (
                        <>
                          <Lock
                            size={14}
                            strokeWidth={1.75}
                            className="text-muted-foreground"
                            aria-hidden
                          />
                          <span className="sr-only">Password protected</span>
                        </>
                      )}
                    </Link>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                </td>
                <td className="px-4 font-mono text-xs text-muted-foreground max-lg:hidden">
                  {shortToken(s.token)}
                </td>
                <td className="px-4">
                  {s.type === 'rule' ? (
                    <Badge tone="info" icon={Info}>
                      Live rule
                    </Badge>
                  ) : (
                    <Badge>Pinned · {s.studies}</Badge>
                  )}
                </td>
                <td className="px-4">
                  <ViewsMeter share={s} />
                </td>
                <td className="px-4">
                  <Expiry share={s} />
                </td>
                <td className="px-4 text-muted-foreground max-lg:hidden">{s.owner}</td>
                <td className="px-2">
                  <RowMenu share={s} onRevoke={onRevoke} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/** Blank contact-sheet frames with one accent detail (the kit's empty-state art). */
function EmptyIllustration() {
  return (
    <svg width={96} height={43} viewBox="0 0 120 54" fill="none" aria-hidden>
      {[0, 42, 84].map((x, i) => (
        <rect
          key={x}
          x={x + 1}
          y={1}
          width={34}
          height={26}
          rx={2}
          stroke={i === 1 ? 'var(--accent)' : 'var(--muted-foreground)'}
          strokeWidth={1.5}
        />
      ))}
      {[0, 42, 84].map((x) => (
        <rect
          key={x}
          x={x + 1}
          y={29}
          width={34}
          height={24}
          rx={2}
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          opacity={0.6}
        />
      ))}
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Dialogs                                                                      */
/* -------------------------------------------------------------------------- */

/** Shown once after a share is created. The password is only known to this browser tab. */
function LinkReadyDialog({ created }: { created: NonNullable<SharesProps['created']> }) {
  const [open, setOpen] = useState(true)
  const [password] = useState(() => (created.protected ? passwordHandoff.take() : null))
  const url = shareUrl(created.token)

  const close = (next: boolean) => {
    setOpen(next)
    // Drop `?created=` so a refresh or back-navigation doesn't reopen the dialog.
    if (!next)
      router.get('/shares', {}, { replace: true, preserveState: true, preserveScroll: true })
  }

  return (
    <Dialog.Root open={open} onOpenChange={close}>
      <Dialog.Portal>
        <Dialog.Backdrop className={backdropCls} />
        <Dialog.Popup className={dialogPopupCls}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="font-display text-xl/7 font-semibold">
                Link ready
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                “{created.name}” is live. Send the link
                {created.protected ? ' and the password separately' : ''}.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X size={16} strokeWidth={1.75} aria-hidden />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ready-url" className="text-[13px]/[18px] font-medium">
              Link
            </label>
            <div className="flex gap-2">
              <input
                id="ready-url"
                readOnly
                value={url}
                onFocus={(e) => e.currentTarget.select()}
                className={`${inputCls} font-mono text-xs`}
              />
              <CopyButton value={url} announce="Link copied" className={`${primaryBtn} shrink-0`}>
                Copy link
              </CopyButton>
            </div>
          </div>

          {created.protected && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ready-password" className="text-[13px]/[18px] font-medium">
                Password
              </label>
              {password ? (
                <>
                  <div className="flex gap-2">
                    <input
                      id="ready-password"
                      readOnly
                      value={password}
                      onFocus={(e) => e.currentTarget.select()}
                      className={`${inputCls} font-mono text-xs`}
                    />
                    <CopyButton
                      value={password}
                      announce="Password copied"
                      className={`${secondaryBtn} shrink-0`}
                    >
                      Copy password
                    </CopyButton>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Shown once. It’s stored hashed, so it can’t be recovered later.
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The password is no longer available in this session. Edit the share to set a new
                  one.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Link href={`/shares/${created.id}`} className={secondaryBtn}>
              View share
            </Link>
            <button type="button" onClick={() => close(false)} className={primaryBtn}>
              Done
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                         */
/* -------------------------------------------------------------------------- */

export default function Shares({ shares, created }: SharesProps) {
  const [tab, setTab] = useState<TabValue>('all')
  const [query, setQuery] = useState('')
  const [revoking, setRevoking] = useState<ShareRow | null>(null)

  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.value, shares.filter(t.match).length])),
    [shares]
  )
  const needle = query.trim().toLowerCase()
  const rows = useMemo(() => {
    const match = TABS.find((t) => t.value === tab)!.match
    return shares.filter(
      (s) =>
        match(s) && (!needle || `${s.name} ${s.owner} ${s.token}`.toLowerCase().includes(needle))
    )
  }, [shares, tab, needle])

  // `N` opens the builder from the list, like the other list pages.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== 'n') return
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      router.visit('/shares/new')
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  return (
    <Page
      title="Shares"
      description={
        shares.length === 0
          ? 'Protected links to selected work.'
          : `${counts.active} active · ${counts.expiring} expiring soon`
      }
      wide
      actions={
        <Link href="/shares/new" className={primaryBtn}>
          <Plus size={16} strokeWidth={1.75} aria-hidden /> New share
          <kbd className="ml-1 hidden rounded-sm bg-primary-foreground/15 px-1 font-mono text-[11px] sm:inline">
            N
          </kbd>
        </Link>
      }
    >
      {shares.length === 0 ? (
        <Card className="p-0">
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <EmptyIllustration />
            <p className="font-display text-base/6 font-semibold">Create your first share link.</p>
            <p className="max-w-[44ch] text-sm text-muted-foreground">
              Pick the case studies a client should see, add a password and an expiry, and send them
              one link.
            </p>
          </div>
        </Card>
      ) : (
        <Tabs.Root value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 border-b border-border">
            <Tabs.List className="relative flex gap-1 overflow-x-auto">
              {TABS.map((t) => (
                <Tabs.Tab key={t.value} value={t.value} className={tabCls}>
                  {t.label}
                  <span className="font-mono text-xs text-muted-foreground">{counts[t.value]}</span>
                </Tabs.Tab>
              ))}
              <Tabs.Indicator className="absolute bottom-0 left-[var(--active-tab-left)] h-0.5 w-[var(--active-tab-width)] rounded-full bg-primary transition-[left,width] duration-[180ms] ease-[var(--ease-out)] motion-reduce:transition-none" />
            </Tabs.List>
            <div className="relative my-1 w-full sm:w-64">
              <Search
                size={16}
                strokeWidth={1.75}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or owner"
                aria-label="Search shares"
                className={`${inputCls} pl-8`}
              />
            </div>
          </div>

          <Card className="p-0">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <EmptyIllustration />
                <p className="font-display text-base/6 font-semibold">
                  {needle ? `No shares match “${query}”.` : 'No shares in this view.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setTab('all')
                  }}
                  className={secondaryBtn}
                >
                  Show all shares
                </button>
              </div>
            ) : (
              <SharesTable rows={rows} onRevoke={setRevoking} />
            )}
          </Card>
        </Tabs.Root>
      )}

      <RevokeDialog target={revoking} onClose={() => setRevoking(null)} />
      {created && <LinkReadyDialog key={created.id} created={created} />}
    </Page>
  )
}

Shares.layout = [AppLayout]
