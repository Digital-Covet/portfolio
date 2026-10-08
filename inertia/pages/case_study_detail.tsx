import { useState } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Dialog, DialogBackdrop, DialogPopup, DialogTitle } from '~/components/ui/dialog'
import {
  BarChart3,
  BookOpen,
  Building2,
  Eye,
  FileText,
  Images,
  Link2,
  Paperclip,
  Pencil,
  Quote,
  Video,
} from 'lucide-react'
import AppShell from '~/layouts/app_shell'
import Page from '~/components/page'
import { EmptyState, StatusBadge } from '~/components/dashboard/widgets'
import type { InertiaProps } from '~/types'
import type { CaseStudyDetailProps } from '~/components/case_study_detail/types'

type Props = InertiaProps<CaseStudyDetailProps>

function Chip({ children }: { children: string }) {
  return <span className="csd-chip">{children}</span>
}

export default function CaseStudyDetail({ caseStudy, permissions, sharedIn }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const editable = permissions.editable
  const cs = caseStudy

  const taxonomyLine = [cs.sector, cs.industry, cs.keyBusiness].filter(Boolean).join(' › ')
  const hasTestimonial = Boolean(cs.testimonial.quote.trim())

  return (
    <Page
      title={cs.title || 'Untitled case study'}
      description={
        <span className="telemetry csd-slug">
          /{cs.slug || 'untitled'} · Updated {cs.updatedRelative}
        </span>
      }
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={() => setPreviewOpen(true)}>
            <Eye size={15} aria-hidden />
            Preview
          </button>
          {editable ? (
            <Link href={`/case-studies/${cs.id}/edit`} className="btn btn--outline">
              <Pencil size={15} aria-hidden />
              Edit
            </Link>
          ) : (
            <span
              className="btn btn--outline"
              aria-disabled="true"
              data-disabled="true"
              title={`Owned by ${permissions.ownerName ?? 'someone'}`}
              style={{ opacity: 0.5, pointerEvents: 'none' }}
            >
              <Pencil size={15} aria-hidden />
              Edit
            </span>
          )}
        </>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <StatusBadge status={cs.status} />
      </div>

      {!editable && (
        <div className="alert csd-banner" role="note">
          <p>
            You can view this case study but not edit it. Owned by{' '}
            {permissions.ownerName ?? 'someone'}
            {permissions.ownerDepartment ? `, ${permissions.ownerDepartment}` : ''}.
          </p>
        </div>
      )}

      <div className="csd-grid">
        {/* 2/3 rendered story + gallery */}
        <div className="csd-main">
          {cs.heroImageUrl ? (
            <img src={cs.heroImageUrl} alt="" className="csd-hero" fetchPriority="high" />
          ) : (
            <div className="csd-hero csd-hero--empty" aria-hidden="true" />
          )}

          {cs.summary ? (
            <p className="csd-summary">{cs.summary}</p>
          ) : (
            <p className="csd-muted">No summary yet.</p>
          )}

          <section aria-labelledby="csd-story" className="csd-section">
            <div className="csd-sectionhead">
              <span className="csd-sectionhead__icon">
                <BookOpen size={16} aria-hidden />
              </span>
              <h2 id="csd-story" className="csd-sectionhead__title">
                Story
              </h2>
            </div>
            {cs.storyMarkdown.trim() ? (
              <p className="csd-prose">{cs.storyMarkdown}</p>
            ) : (
              <p className="csd-muted">No story written yet.</p>
            )}
          </section>

          <section aria-labelledby="csd-results" className="csd-section">
            <div className="csd-sectionhead">
              <span className="csd-sectionhead__icon">
                <BarChart3 size={16} aria-hidden />
              </span>
              <h2 id="csd-results" className="csd-sectionhead__title">
                Results
              </h2>
            </div>
            {cs.metrics.length > 0 ? (
              <dl className="csd-metrics">
                {cs.metrics.map((m) => (
                  <div key={m.label} className="csd-metric">
                    <dt className="telemetry-label">{m.label}</dt>
                    <dd className="telemetry csd-metric__value">
                      {m.value}
                      {m.suffix}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="csd-muted">No metrics yet.</p>
            )}
          </section>

          {cs.videos.length > 0 && (
            <section aria-labelledby="csd-video" className="csd-section">
              <div className="csd-sectionhead">
                <span className="csd-sectionhead__icon">
                  <Video size={16} aria-hidden />
                </span>
                <h2 id="csd-video" className="csd-sectionhead__title">
                  Video
                </h2>
              </div>
              <ul className="csd-list">
                {cs.videos.map((v) => (
                  <li key={v.url} className="csd-videofacade">
                    <span className="csd-videofacade__label telemetry">{v.provider}</span>
                    <a href={v.url} className="dash-link">
                      {v.url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="csd-gallery" className="csd-section">
            <div className="csd-sectionhead">
              <span className="csd-sectionhead__icon">
                <Images size={16} aria-hidden />
              </span>
              <h2 id="csd-gallery" className="csd-sectionhead__title">
                Gallery
              </h2>
            </div>
            {cs.gallery.length > 0 ? (
              <ul className="csd-gallery">
                {cs.gallery.map((g, i) => (
                  <li key={g.key} className="csd-gtile">
                    <img src={g.url} alt={`${cs.title}, image ${i + 1} of ${cs.gallery.length}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="csd-muted">No gallery images.</p>
            )}
          </section>

          {(hasTestimonial || cs.attachments.length > 0) && (
            <section aria-labelledby="csd-more" className="csd-section">
              <div className="csd-sectionhead">
                <span className="csd-sectionhead__icon">
                  <Quote size={16} aria-hidden />
                </span>
                <h2 id="csd-more" className="csd-sectionhead__title">
                  Testimonial & files
                </h2>
              </div>
              {hasTestimonial && (
                <blockquote className="csd-quote">
                  <p>“{cs.testimonial.quote}”</p>
                  <footer>
                    {cs.testimonial.name}
                    {cs.testimonial.role ? ` · ${cs.testimonial.role}` : ''}
                  </footer>
                </blockquote>
              )}
              {cs.attachments.length > 0 && (
                <ul className="csd-files">
                  {cs.attachments.map((a) => (
                    <li key={a.key} className="csd-filerow">
                      <FileText size={15} aria-hidden />
                      <span className="csd-filerow__name">{a.name}</span>
                      <span className="telemetry csd-filerow__size">{a.size}</span>
                      <a href={a.url} className="dash-link">
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* 1/3 key attributes + shared in */}
        <aside className="csd-rail" aria-label="Case study details">
          <section className="csd-railcard" aria-labelledby="csd-attrs">
            <h2 id="csd-attrs" className="csd-railcard__title">
              Key attributes
            </h2>
            <dl className="csd-attrs">
              <div>
                <dt className="telemetry-label">Client</dt>
                <dd className="csd-client">
                  <span className="client-chip">
                    <Building2 size={12} aria-hidden />
                  </span>
                  {cs.client.name}
                </dd>
              </div>
              <div>
                <dt className="telemetry-label">Sector › Industry</dt>
                <dd>{taxonomyLine || '—'}</dd>
              </div>
              <div>
                <dt className="telemetry-label">Owner</dt>
                <dd>
                  {cs.ownerName} · {cs.department}
                </dd>
              </div>
            </dl>
            {(cs.services.length > 0 || cs.categories.length > 0) && (
              <div className="csd-chips">
                {[...cs.services, ...cs.categories].map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
            )}
          </section>

          <section className="csd-railcard" aria-labelledby="csd-shared">
            <h2 id="csd-shared" className="csd-railcard__title">
              Shared in
            </h2>
            {sharedIn.length > 0 ? (
              <ul className="csd-shares">
                {sharedIn.map((s) => (
                  <li key={s.id} className="csd-share">
                    <div className="csd-share__main">
                      <span className="csd-share__title">
                        {s.recipient} · {s.company}
                      </span>
                      <span className="telemetry csd-share__meta">
                        …{s.tokenSuffix} · {s.views}
                      </span>
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={<Paperclip size={20} aria-hidden />}
                title="Not in any share yet"
                action={
                  <Link
                    href={`/shares/new?caseStudy=${cs.id}`}
                    className="btn btn--outline btn--sm"
                  >
                    <Link2 size={14} aria-hidden />
                    Add to share
                  </Link>
                }
              />
            )}
          </section>
        </aside>
      </div>

      <Dialog.Root open={previewOpen} onOpenChange={setPreviewOpen}>
        <Dialog.Portal>
          <DialogBackdrop />
          <DialogPopup className="csd-preview" aria-label={`Preview of ${cs.title}`}>
            {cs.heroImageUrl && <img src={cs.heroImageUrl} alt="" className="csd-hero" />}
            <DialogTitle className="csd-preview__title">{cs.title}</DialogTitle>
            {cs.summary && <p className="csd-summary">{cs.summary}</p>}
            {cs.storyMarkdown.trim() && <p className="csd-prose">{cs.storyMarkdown}</p>}
            <div className="cs-dialog__actions">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
            </div>
          </DialogPopup>
        </Dialog.Portal>
      </Dialog.Root>
    </Page>
  )
}

CaseStudyDetail.layout = (page: React.ReactNode) => (
  <AppShell crumbs={[{ label: 'Case studies', href: '/case-studies' }, { label: 'Detail' }]}>
    {page}
  </AppShell>
)
