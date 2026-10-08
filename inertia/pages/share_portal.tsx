import { useEffect, useMemo, useState } from 'react'
import { Head, useForm, usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import { Dialog, DialogBackdrop, DialogPopup, DialogTitle } from '~/components/ui/dialog'
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Eye, FileText, X } from 'lucide-react'
import { LogoMark } from '~/components/logo'
import FlashToasts from '~/components/flash_toasts'
import NavProgress from '~/components/nav_progress'
import type { InertiaProps } from '~/types'
import type { PortalItem, SharePortalProps } from '~/components/shares/types'

type Props = InertiaProps<SharePortalProps>

function Unavailable({ kind }: { kind: string }) {
  const titles: Record<string, string> = {
    expired: 'This link has expired',
    limit: 'This link has reached its view limit',
    unavailable: "This link isn't available",
    locked: 'Too many attempts',
  }
  return (
    <div className="portal-gate">
      <div className="portal-gate__card">
        <LogoMark size={32} />
        <h1>{titles[kind] ?? titles.unavailable}</h1>
        <p>Ask your Digital Covet contact for a new link.</p>
        <a href="https://digitalcovet.com" className="btn btn--outline">
          Visit digitalcovet.com
        </a>
      </div>
    </div>
  )
}

function Gate({ recipient, token }: { recipient: string | null; token: string }) {
  const { data, setData, post, processing, errors } = useForm({ password: '' })
  const [show, setShow] = useState(false)

  return (
    <div className="portal-gate">
      <div className="covet-grid portal-gate__grid" aria-hidden="true" />
      <div className="portal-gate__card">
        <LogoMark size={32} />
        <p className="telemetry-label">Private portfolio</p>
        <h1>A private portfolio{recipient ? ` for ${recipient}` : ''}</h1>
        <p>Enter the password you were sent to view this work.</p>
        <Form
          action={`/s/${token}/unlock`}
          method="post"
          onSubmit={() => {}}
          disableWhileProcessing
        >
          {({ processing: _p }) => (
            <>
              <div className="field">
                <label className="field__label" htmlFor="portal-password">
                  Password
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="portal-password"
                    type={show ? 'text' : 'password'}
                    autoFocus
                    autoComplete="current-password"
                    className="field__input halo"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    aria-describedby={errors.password ? 'portal-password-error' : undefined}
                    aria-invalid={errors.password ? true : undefined}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    <Eye size={15} aria-hidden />
                  </button>
                </div>
                {errors.password && (
                  <p id="portal-password-error" className="field__error" role="alert">
                    That password isn&apos;t right. Try again.
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={processing || _p}
                style={{ marginTop: 16 }}
                onClick={(e) => {
                  e.preventDefault()
                  post(`/s/${token}/unlock`)
                }}
              >
                View portfolio
                <ArrowRight size={15} aria-hidden />
              </button>
            </>
          )}
        </Form>
      </div>
    </div>
  )
}

function CaseDialog({
  item,
  open,
  onOpenChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  item: PortalItem | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  const handleOpenChange = (v: boolean) => {
    if (!v) setLightbox(null)
    onOpenChange(v)
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <DialogBackdrop className="portal-dialog__scrim" />
          <DialogPopup className="portal-dialog" aria-label={item ? item.title : 'Case study'}>
            {item && (
              <>
                {item.heroImage && (
                  <img src={item.heroImage} alt="" className="portal-dialog__hero" />
                )}
                <DialogTitle>{item.title}</DialogTitle>
                <p className="portal-dialog__meta">
                  {item.clientName} ·{' '}
                  {[item.sector, item.industry, item.keyBusiness].filter(Boolean).join(' › ')}
                </p>
                {item.services.length > 0 && (
                  <div className="csd-chips">
                    {item.services.map((s) => (
                      <span key={s} className="csd-chip">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {item.storyMarkdown.trim() && <p className="csd-prose">{item.storyMarkdown}</p>}
                {item.metrics.length > 0 && (
                  <dl className="csd-metrics">
                    {item.metrics.map((m) => (
                      <div key={m.label} className="csd-metric">
                        <dt className="telemetry-label">{m.label}</dt>
                        <dd className="telemetry csd-metric__value">
                          {m.value}
                          {m.suffix}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {item.gallery.length > 0 && (
                  <ul className="portal-dialog__gallery">
                    {item.gallery.map((g, i) => (
                      <li key={g.url}>
                        <button
                          type="button"
                          className="portal-dialog__gbtn"
                          onClick={() => setLightbox(i)}
                          aria-label={`Open image ${i + 1} of ${item.gallery.length}: ${g.caption || item.title}`}
                        >
                          <img
                            src={g.url}
                            alt={
                              g.caption || `${item.title}, image ${i + 1} of ${item.gallery.length}`
                            }
                            loading="lazy"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {item.testimonial.quote.trim() && (
                  <blockquote className="csd-quote">
                    <p>&ldquo;{item.testimonial.quote}&rdquo;</p>
                    <footer>
                      {item.testimonial.name}
                      {item.testimonial.role ? ` · ${item.testimonial.role}` : ''}
                    </footer>
                  </blockquote>
                )}
                {item.attachments.length > 0 && (
                  <ul className="csd-files">
                    {item.attachments.map((a) => (
                      <li key={a.url} className="csd-filerow">
                        <FileText size={15} aria-hidden />
                        <span className="csd-filerow__name">{a.name}</span>
                        <span className="telemetry csd-filerow__size">{a.size}</span>
                        <a href={a.url} className="dash-link" download>
                          Download
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="portal-dialog__footer">
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={onPrev}
                    disabled={!hasPrev}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={onNext}
                    disabled={!hasNext}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </DialogPopup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={lightbox !== null} onOpenChange={(v) => !v && setLightbox(null)}>
        <Dialog.Portal>
          <DialogBackdrop className="portal-lightbox__scrim" />
          <DialogPopup className="portal-lightbox" aria-label="Image viewer">
            {item && lightbox !== null && item.gallery[lightbox] && (
              <>
                <img
                  src={item.gallery[lightbox].url}
                  alt={
                    item.gallery[lightbox].caption ||
                    `${item.title}, image ${lightbox + 1} of ${item.gallery.length}`
                  }
                  className="portal-lightbox__img"
                />
                <div className="portal-lightbox__bar">
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Close viewer"
                    onClick={() => setLightbox(null)}
                  >
                    <X size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Previous image"
                    disabled={lightbox === 0}
                    onClick={() => setLightbox((i) => (i === null ? i : Math.max(0, i - 1)))}
                  >
                    <ChevronLeft size={16} aria-hidden />
                  </button>
                  <span className="telemetry portal-lightbox__count">
                    {lightbox + 1} / {item.gallery.length}
                  </span>
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Next image"
                    disabled={lightbox === item.gallery.length - 1}
                    onClick={() =>
                      setLightbox((i) =>
                        i === null ? i : Math.min(item.gallery.length - 1, i + 1)
                      )
                    }
                  >
                    <ChevronRight size={16} aria-hidden />
                  </button>
                </div>
              </>
            )}
          </DialogPopup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default function SharePortal(props: Props) {
  const { state, token, gate, portal } = props
  const page = usePage()
  const flashError = (page.props as unknown as { error?: string }).error
  const [sector, setSector] = useState<string>('all')
  const [openSlug, setOpenSlug] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('cs')
  })

  const items = useMemo(() => portal?.items ?? [], [portal])
  const sectors = useMemo(() => portal?.sectors ?? [], [portal])
  const filtered = useMemo(
    () => (sector === 'all' ? items : items.filter((i) => i.sector === sector)),
    [items, sector]
  )
  const openIndex = openSlug ? filtered.findIndex((i) => i.slug === openSlug) : -1
  const openItem = openIndex >= 0 ? filtered[openIndex] : null

  useEffect(() => {
    const url = new URL(window.location.href)
    if (openSlug) url.searchParams.set('cs', openSlug)
    else url.searchParams.delete('cs')
    window.history.replaceState(null, '', url.toString())
  }, [openSlug])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (openIndex < 0) return
      if (e.key === 'ArrowRight') {
        const next = filtered[openIndex + 1]
        if (next) setOpenSlug(next.slug)
      } else if (e.key === 'ArrowLeft') {
        const prev = filtered[openIndex - 1]
        if (prev) setOpenSlug(prev.slug)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, filtered])

  if (state === 'gate') {
    return (
      <div data-surface="dark" className="portal-root">
        <Head title="Private portfolio" />
        <meta name="robots" content="noindex, nofollow" />
        {flashError && (
          <p role="alert" className="visually-hidden">
            {flashError}
          </p>
        )}
        <Gate recipient={gate?.recipient ?? null} token={token} />
        <NavProgress />
        <FlashToasts />
      </div>
    )
  }

  if (state !== 'viewer' || !portal) {
    return (
      <div data-surface="dark" className="portal-root">
        <Head title="Portfolio link" />
        <meta name="robots" content="noindex, nofollow" />
        <Unavailable kind={state} />
        <NavProgress />
        <FlashToasts />
      </div>
    )
  }

  const showChips = items.length >= 8 && sectors.length >= 2

  return (
    <div data-surface="dark" className="portal-root">
      <Head title={portal.company ? `Selected work for ${portal.company}` : 'Selected work'} />
      <meta name="robots" content="noindex, nofollow" />
      <meta name="referrer" content="no-referrer" />

      <header className="portal-header">
        <LogoMark size={28} />
        <span style={{ flex: 1 }} />
        {portal.recipient && (
          <span className="telemetry-label portal-header__who">
            Prepared for {portal.recipient.toUpperCase()}
          </span>
        )}
      </header>

      <section className="portal-hero">
        <div className="covet-grid portal-hero__grid" aria-hidden="true" />
        <p className="telemetry-label">Portfolio · {portal.count} case studies</p>
        <h1>{portal.company ? `Selected work for ${portal.company}` : 'Selected work'}</h1>
        {portal.intro && <p className="portal-hero__intro">{portal.intro}</p>}
      </section>

      {showChips && (
        <div className="portal-chips" role="group" aria-label="Filter by sector">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            data-active={sector === 'all' ? 'true' : 'false'}
            onClick={() => setSector('all')}
          >
            All
          </button>
          {sectors.map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn--ghost btn--sm"
              data-active={sector === s ? 'true' : 'false'}
              onClick={() => setSector(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <main className="portal-main">
        {filtered.length === 0 ? (
          <div className="empty">
            <p className="empty__title">Nothing to show yet</p>
            <a href="https://digitalcovet.com" className="btn btn--outline btn--sm">
              Contact Digital Covet
            </a>
          </div>
        ) : (
          <ul className="portal-grid">
            {filtered.map((item, idx) => (
              <li key={item.id} className="portal-card" data-feature={idx === 0 ? 'true' : 'false'}>
                <button
                  type="button"
                  className="portal-card__link"
                  onClick={() => setOpenSlug(item.slug)}
                  aria-label={`View case study: ${item.title}`}
                >
                  {item.heroImage ? (
                    <img
                      src={item.heroImage}
                      alt=""
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      fetchPriority={idx === 0 ? 'high' : undefined}
                      className="portal-card__img"
                    />
                  ) : (
                    <span className="portal-card__img" aria-hidden="true" />
                  )}
                  <span className="portal-card__body">
                    <span className="client-chip">{item.clientName}</span>
                    <span className="telemetry-label">{item.sector}</span>
                    <span className="portal-card__title">{item.title}</span>
                    <span className="portal-card__summary">{item.summary}</span>
                    <span className="dash-link">
                      View case study <ArrowUpRight size={13} aria-hidden />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <CaseDialog
        item={openItem}
        open={openItem !== null}
        onOpenChange={(v) => !v && setOpenSlug(null)}
        onPrev={() => {
          const prev = filtered[openIndex - 1]
          if (prev) setOpenSlug(prev.slug)
        }}
        onNext={() => {
          const next = filtered[openIndex + 1]
          if (next) setOpenSlug(next.slug)
        }}
        hasPrev={openIndex > 0}
        hasNext={openIndex >= 0 && openIndex < filtered.length - 1}
      />

      <NavProgress />
      <FlashToasts />
    </div>
  )
}

// Public page: no AppShell (external recipients, no nav).
