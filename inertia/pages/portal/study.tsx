import { Head, Link } from '@inertiajs/react'
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Mail,
  Play,
  Quote,
} from 'lucide-react'
import { CropFrame, Folio } from '~/components/decor'
import { fmtSize, parseContent, Prose } from '~/components/prose'
import PortalLayout from '~/layouts/portal'
import { embedUrl } from '~/lib/embed'

type Owner = { name: string | null; email: string | null }
type Sibling = { slug: string; title: string } | null

/** Mirrors the props sent by PortalController.study. */
type StudyProps = {
  token: string
  expiresAt: string | null
  owner: Owner
  study: {
    slug: string
    folio: number
    title: string
    client: string
    content: string
    hero: string | null
    categories: string[]
    services: string[]
    metrics: { id: string; label: string; value: string }[]
    testimonials: { id: string; quote: string; authorName: string; authorTitle: string | null }[]
    videos: { id: string; url: string }[]
    gallery: { id: string; name: string; src: string | null }[]
    attachments: { id: string; name: string; size: number; href: string }[]
  }
  prev: Sibling
  next: Sibling
}

const navLink =
  'inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:text-foreground'

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-display text-2xl/8 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function PortalStudy({ token, owner, study, prev, next }: StudyProps) {
  const { overview, sections } = parseContent(study.content)
  const contact = owner.email
    ? `mailto:${owner.email}?subject=${encodeURIComponent(`About ${study.title}`)}`
    : undefined

  return (
    <>
      <Head title={study.title} />
      {/* Sticky wayfinding; the page itself carries no app navigation. */}
      <nav
        aria-label="Study navigation"
        className="sticky top-0 z-20 flex items-center justify-between border-y border-border bg-background/90 px-3 backdrop-blur-sm xl:px-9"
      >
        <Link href={`/s/${token}`} className={navLink}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden /> All work
        </Link>
        {next && (
          <Link href={`/s/${token}/${next.slug}`} className={navLink}>
            <span className="max-w-[40vw] truncate">Next study</span>
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </nav>

      <article className="mx-auto flex max-w-[1280px] flex-col gap-12 px-6 pb-24 pt-10 xl:px-12">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Folio n={study.folio} />
            <span aria-hidden>·</span>
            <span>{study.client}</span>
            {study.categories.map((c) => (
              <span
                key={c}
                className="inline-flex h-6 items-center rounded-full border border-border px-2 text-xs"
              >
                {c}
              </span>
            ))}
          </div>
          <h1 className="font-display text-[clamp(2.25rem,1.5rem+2.4vw,3.75rem)] font-semibold leading-[1.05]">
            {study.title}
          </h1>
        </header>

        <CropFrame tick={20}>
          {study.hero ? (
            <img
              src={study.hero}
              alt=""
              width={1280}
              height={720}
              fetchPriority="high"
              className="aspect-video w-full rounded-md object-cover"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md bg-surface-raised text-muted-foreground">
              <ImageIcon size={20} strokeWidth={1.75} aria-hidden />
            </div>
          )}
        </CropFrame>

        {study.metrics.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-border py-8 lg:grid-cols-4">
            {study.metrics.map((m) => (
              <div key={m.id} className="flex min-w-0 flex-col-reverse gap-1">
                <dd className="truncate font-mono text-[32px]/10 font-medium">{m.value}</dd>
                <dt className="text-[13px]/[18px] text-muted-foreground">{m.label}</dt>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-col gap-12">
          {overview && (
            <Block title="Overview">
              <Prose text={overview} />
            </Block>
          )}
          {sections.map((s) => (
            <Block key={s.heading} title={s.heading}>
              <Prose text={s.body} />
            </Block>
          ))}
        </div>

        {study.gallery.length > 0 && (
          <Block title="Gallery">
            <ul className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-[6px] bg-surface-raised p-0.5 md:grid-cols-3">
              {study.gallery.map((g, i) => (
                <li key={g.id}>
                  <div className="aspect-[4/3] overflow-hidden bg-secondary">
                    {g.src && (
                      <img
                        src={g.src}
                        alt={g.name}
                        width={640}
                        height={480}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                  <span className="block py-1 text-center font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {study.videos.length > 0 && (
          <Block title="Video">
            <ul className="flex flex-col gap-4">
              {study.videos.map((v) => {
                const src = embedUrl(v.url)
                return (
                  <li key={v.id}>
                    {src ? (
                      <iframe
                        src={src}
                        title="Case study video"
                        loading="lazy"
                        allow="fullscreen; picture-in-picture"
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="aspect-video w-full rounded-md border border-border"
                      />
                    ) : (
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Play size={16} strokeWidth={1.75} aria-hidden /> Open video
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          </Block>
        )}

        {study.testimonials.length > 0 && (
          <Block title="In their words">
            <div className="grid gap-4 md:grid-cols-2">
              {study.testimonials.map((t) => (
                <figure key={t.id} className="rounded-lg border border-border bg-surface p-6">
                  <Quote size={16} strokeWidth={1.75} className="text-accent" aria-hidden />
                  <blockquote className="mt-3 max-w-[var(--prose)] text-base/7">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-4 text-[13px]/[18px] text-muted-foreground">
                    <span className="font-medium text-foreground">{t.authorName}</span>
                    {t.authorTitle && <> · {t.authorTitle}</>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Block>
        )}

        {study.attachments.length > 0 && (
          <Block title="Files">
            <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
              {study.attachments.map((a) => (
                <li key={a.id} className="flex h-12 items-center gap-3 px-4 text-sm">
                  <FileText
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <a href={a.href} download className="min-w-0 flex-1 truncate hover:text-primary">
                    {a.name}
                  </a>
                  <span className="font-mono text-xs text-muted-foreground">{fmtSize(a.size)}</span>
                </li>
              ))}
            </ul>
          </Block>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
          <div className="flex flex-wrap gap-2">
            {prev && (
              <Link href={`/s/${token}/${prev.slug}`} className={navLink}>
                <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
                <span className="max-w-[40vw] truncate">{prev.title}</span>
              </Link>
            )}
            {next && (
              <Link href={`/s/${token}/${next.slug}`} className={navLink}>
                <span className="max-w-[40vw] truncate">{next.title}</span>
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
              </Link>
            )}
          </div>
          {contact && (
            <a
              href={contact}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-secondary px-5 text-sm font-medium transition-colors hover:bg-secondary/70"
            >
              <Mail size={16} strokeWidth={1.75} aria-hidden /> Contact Digital Covet
            </a>
          )}
        </footer>
      </article>
    </>
  )
}

PortalStudy.layout = [PortalLayout]
