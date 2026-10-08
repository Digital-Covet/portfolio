import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { router } from '@inertiajs/react'
import { Check, Copy, Layers, Link2, ShieldCheck, TriangleAlert, UserRound } from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import type { InertiaProps } from '~/types'
import type { BuilderMode, ShareBuilderProps } from '~/components/shares/types'

type Props = InertiaProps<ShareBuilderProps>

function randomPassword(n = 12) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const buf = new Uint32Array(n)
  crypto.getRandomValues(buf)
  return Array.from(buf, (x) => chars[x % chars.length]).join('')
}

function ToggleMode({ mode, onChange }: { mode: BuilderMode; onChange: (m: BuilderMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Content mode" style={{ display: 'inline-flex', gap: 4 }}>
      {(
        [
          { key: 'selected', label: 'Selected case studies' },
          { key: 'rule', label: 'Filter rule' },
        ] as const
      ).map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={mode === o.key}
          className="btn btn--outline btn--sm"
          data-active={mode === o.key ? 'true' : 'false'}
          style={
            mode === o.key ? { borderColor: 'var(--primary)', color: 'var(--fg-1)' } : undefined
          }
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function ShareBuilder({ mode, share, options, matchPreview, permissions }: Props) {
  const isNew = mode === 'new'
  const editable = permissions.editable
  const canUseFilters = permissions.canUseFilters ?? true
  const [contentMode, setContentMode] = useState<BuilderMode>(
    canUseFilters ? share.mode : 'selected'
  )
  const [selected, setSelected] = useState<string[]>(share.selectedIds)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

  const [rule, setRule] = useState(share.rule)
  const [recipientName, setRecipientName] = useState(share.recipientName)
  const [company, setCompany] = useState(share.company)
  const [email, setEmail] = useState(share.email)
  const [requirePassword, setRequirePassword] = useState(share.requirePassword)
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState(share.expiresAt ?? '')
  const [maxViews, setMaxViews] = useState<number | ''>(share.maxViews ?? '')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSubmitError(null)
    const effectiveMode = canUseFilters ? contentMode : 'selected'
    const payload = {
      mode: effectiveMode,
      caseStudyIds: selected,
      rule,
      recipientName,
      company,
      email,
      requirePassword,
      ...(requirePassword && password ? { password } : {}),
      ...(expiresAt ? { expiresAt } : {}),
      ...(maxViews !== '' ? { maxViews } : {}),
    }
    const opts = {
      preserveScroll: true,
      onSuccess: () => setSaving(false),
      onError: () => {
        setSaving(false)
        setSubmitError('Couldn’t save this share. Check the fields and retry.')
      },
    } as const
    if (isNew) router.post('/shares', payload as never, opts)
    else router.put(`/shares/${share.id}`, payload as never, opts)
  }

  const copy = async () => {
    if (!share.link) return
    const url = share.link.startsWith('http')
      ? share.link
      : `${window.location.origin}${share.link}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setCopyMsg('Link copied')
    window.setTimeout(() => {
      setCopied(false)
      setCopyMsg('')
    }, 1500)
  }

  return (
    <Page
      title={isNew ? 'New share' : 'Edit share'}
      description="Choose what recipients see, then set how they get in."
      actions={
        <Link href="/shares" className="btn btn--ghost">
          Cancel
        </Link>
      }
    >
      {!editable && (
        <div className="alert" role="note" style={{ marginBottom: 16 }}>
          <p>Owned by {permissions.ownerName ?? 'someone'}. Read-only.</p>
        </div>
      )}

      {share.expired && (
        <div className="alert" role="alert" style={{ marginBottom: 16 }}>
          <TriangleAlert size={16} aria-hidden style={{ color: 'var(--warning)' }} />
          <p>This link expired {share.expiredAt ?? ''}. Set a new date.</p>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="shb-grid">
          {/* Content picker */}
          <div>
            <div className="cse-sectionhead">
              <span className="cse-sectionhead__icon">
                <Layers size={16} aria-hidden />
              </span>
              <h2 className="cse-sectionhead__title">Content</h2>
            </div>
            <ToggleMode
              mode={contentMode}
              onChange={(m) => {
                if (m === 'rule' && !canUseFilters) return
                setContentMode(m)
              }}
            />
            {!canUseFilters && (
              <p className="telemetry" role="note" style={{ marginTop: 8 }}>
                Filter rules are admin-only. Pick specific case studies.
              </p>
            )}

            {contentMode === 'selected' || !canUseFilters ? (
              <div style={{ marginTop: 16 }}>
                {options.caseStudies.length === 0 ? (
                  <div className="empty">
                    <p className="empty__title">No case studies match your search</p>
                    <Link href="/case-studies/new" className="btn btn--outline btn--sm">
                      Create a case study
                    </Link>
                  </div>
                ) : (
                  <ul className="shb-picker" role="group" aria-label="Pick case studies">
                    {options.caseStudies.map((c) => {
                      const checked = selected.includes(c.id)
                      return (
                        <li key={c.id}>
                          <label className="shb-tile" data-selected={checked ? 'true' : 'false'}>
                            <input
                              type="checkbox"
                              className="visually-hidden"
                              checked={checked}
                              onChange={() => toggleSelect(c.id)}
                              aria-label={`Select ${c.title}`}
                            />
                            {c.heroThumb ? (
                              <img src={c.heroThumb} alt="" className="shb-tile__img" />
                            ) : (
                              <span className="shb-tile__img" aria-hidden="true" />
                            )}
                            <span style={{ padding: 12, display: 'grid', gap: 4 }}>
                              <span className="cs-title">{c.title}</span>
                              <span className="cs-sector">{c.clientName}</span>
                              {c.status !== 'published' && (
                                <span className="badge" data-status="expiring">
                                  <TriangleAlert size={13} aria-hidden />
                                  Hidden until published
                                </span>
                              )}
                            </span>
                            {checked && (
                              <span className="shb-tile__check" aria-hidden="true">
                                <Check size={14} />
                              </span>
                            )}
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <fieldset style={{ marginTop: 16, border: 0, padding: 0 }}>
                <legend className="telemetry-label">Filter rule</legend>
                {(
                  [
                    ['sectors', options.sectors],
                    ['industries', options.industries],
                    ['keyBusinesses', options.keyBusinesses],
                    ['categories', options.categories],
                    ['services', options.services],
                  ] as const
                ).map(([key, vals]) => (
                  <div key={key} className="field" style={{ marginTop: 12 }}>
                    <label className="field__label" htmlFor={`shb-${key}`}>
                      {key}
                    </label>
                    <select
                      id={`shb-${key}`}
                      multiple
                      className="field__input"
                      style={{ height: 'auto', minHeight: 88, padding: 8 }}
                      value={rule[key] ?? []}
                      onChange={(e) =>
                        setRule({
                          ...rule,
                          [key]: Array.from(e.target.selectedOptions, (o) => o.value),
                        })
                      }
                    >
                      {vals.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <p className="telemetry shb-match" role="status" aria-live="polite">
                  {matchPreview.count} published case studies match
                </p>
                {matchPreview.thumbs.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {matchPreview.thumbs.slice(0, 6).map((t) => (
                      <span key={t.id} className="dash-thumb" aria-hidden="true" />
                    ))}
                  </div>
                )}
              </fieldset>
            )}
          </div>

          {/* Settings rail */}
          <aside className="shb-rail" aria-label="Share settings">
            <section className="dash-card" aria-labelledby="shb-recipient">
              <h2 id="shb-recipient" className="dash-card__title">
                <UserRound size={15} aria-hidden style={{ marginRight: 8 }} />
                Recipient
              </h2>
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field__label" htmlFor="shb-name">
                  Recipient name
                </label>
                <input
                  id="shb-name"
                  className="field__input"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  disabled={!editable}
                />
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field__label" htmlFor="shb-company">
                  Company
                </label>
                <input
                  id="shb-company"
                  className="field__input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={!editable}
                />
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field__label" htmlFor="shb-email">
                  Email (optional)
                </label>
                <input
                  id="shb-email"
                  type="email"
                  className="field__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editable}
                />
              </div>
            </section>

            <section className="dash-card" aria-labelledby="shb-protection">
              <h2 id="shb-protection" className="dash-card__title">
                <ShieldCheck size={15} aria-hidden style={{ marginRight: 8 }} />
                Protection
              </h2>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={requirePassword}
                  onChange={(e) => setRequirePassword(e.target.checked)}
                  disabled={!editable}
                />
                Require password
              </label>
              {requirePassword && (
                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                  {share.passwordSet && isNew === false ? (
                    <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: 0 }}>Password set. </p>
                  ) : null}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="field__input"
                      aria-label="Share password"
                      value={password}
                      minLength={10}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={!editable}
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setPassword(randomPassword())}
                    >
                      Generate
                    </button>
                  </div>
                  {submitError && <p className="field__error">{submitError}</p>}
                </div>
              )}
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field__label" htmlFor="shb-expiry">
                  Expires
                </label>
                <input
                  id="shb-expiry"
                  type="date"
                  className="field__input telemetry"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={!editable}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {['7 days', '14 days', '30 days', 'No expiry'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        if (p === 'No expiry') return setExpiresAt('')
                        const days = Number.parseInt(p, 10)
                        const d = new Date()
                        d.setDate(d.getDate() + days)
                        setExpiresAt(d.toISOString().slice(0, 10))
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label className="field__label" htmlFor="shb-max">
                  Max views (empty = unlimited)
                </label>
                <input
                  id="shb-max"
                  type="number"
                  min={1}
                  max={100000}
                  className="field__input telemetry"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value === '' ? '' : Number(e.target.value))}
                  disabled={!editable}
                />
              </div>
            </section>

            {share.link && (
              <section className="dash-card" aria-labelledby="shb-link">
                <h2 id="shb-link" className="dash-card__title">
                  <Link2 size={15} aria-hidden style={{ marginRight: 8 }} />
                  Link
                </h2>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <input
                    readOnly
                    className="field__input telemetry halo"
                    value={share.link}
                    aria-label="Share link"
                    onFocus={(e) => e.target.select()}
                  />
                  <button type="button" className="iconbtn" onClick={copy} aria-label="Copy link">
                    {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                  </button>
                </div>
                <p className="telemetry cs-time" role="status" aria-live="polite">
                  {copyMsg || `Created ${share.createdAt ?? ''} · ${share.views} views`}
                </p>
              </section>
            )}

            <div className="shb-footer">
              {submitError && (
                <p className="field__error" role="alert" style={{ margin: '0 0 8px' }}>
                  {submitError}
                </p>
              )}
              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={saving || !editable}
                title={!editable ? `Owned by ${permissions.ownerName ?? 'someone'}` : undefined}
              >
                {isNew ? 'Create share' : 'Save changes'}
              </button>
            </div>
          </aside>
        </div>
      </form>
    </Page>
  )
}

ShareBuilder.layout = (page: React.ReactNode) => (
  <AppShell crumbs={[{ label: 'Shares', href: '/shares' }, { label: 'Builder' }]}>{page}</AppShell>
)
