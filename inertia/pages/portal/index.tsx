import { useMemo, useState, type FormEvent } from 'react'
import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { ArrowRight, Clock, Lock, Mail } from 'lucide-react'
import { CropFrame, Folio } from '~/components/decor'
import PortalLayout from '~/layouts/portal'
import { shortDate } from '~/lib/share'

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

type Card = {
  slug: string
  title: string
  client: string
  folio: number
  categories: string[]
  cover: string | null
}

type Owner = { name: string | null; email: string | null }

type State = 'gate' | 'gallery' | 'expired' | 'limit' | 'unavailable'

/** Mirrors the props sent by PortalController.show. */
type PortalProps = {
  state: State
  token: string
  name: string
  expiresAt: string | null
  owner: Owner
  csrf: string
  studies: Card[]
}

const primaryBtn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-[filter] duration-[var(--duration-fast)] hover:brightness-110 active:brightness-95 motion-reduce:transition-none'
const secondaryBtn =
  'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-secondary px-5 text-sm font-medium transition-colors hover:bg-secondary/70'

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                               */
/* -------------------------------------------------------------------------- */

function contactHref(owner: Owner, subject: string) {
  return owner.email ? `mailto:${owner.email}?subject=${encodeURIComponent(subject)}` : undefined
}

/** A ticket torn along its perforation: two halves, one accent detail. */
function TornStub() {
  return (
    <svg width={140} height={80} viewBox="0 0 140 80" fill="none" aria-hidden>
      <path
        d="M4 8h60l4 6-4 6 4 6-4 6 4 6-4 6 4 6-4 6H4a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z"
        stroke="var(--muted-foreground)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M76 14l4 6-4 6 4 6-4 6 4 6-4 6 4 6h56a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2H76Z"
        transform="translate(0 -6) rotate(3 108 40)"
        stroke="var(--muted-foreground)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        opacity={0.6}
      />
      <circle cx={34} cy={40} r={6} stroke="var(--accent)" strokeWidth={1.5} />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* States                                                                      */
/* -------------------------------------------------------------------------- */

function Dead({ state, owner }: { state: 'expired' | 'limit' | 'unavailable'; owner: Owner }) {
  const heading = {
    expired: 'This link has expired.',
    limit: 'This link has reached its view limit.',
    unavailable: 'This collection is no longer available.',
  }[state]
  const href = contactHref(owner, 'A new link, please')
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-[480px] flex-col items-center justify-center gap-5 px-6 pb-16 text-center">
      <TornStub />
      <h1 className="font-display text-2xl/8 font-semibold">{heading}</h1>
      <p className="text-muted-foreground">Ask your Digital Covet contact for a new link.</p>
      {href && (
        <a href={href} className={secondaryBtn}>
          <Mail size={16} strokeWidth={1.75} aria-hidden />
          {owner.name ? `Email ${owner.name}` : 'Email your contact'}
        </a>
      )}
    </div>
  )
}

function Gate({ token, csrf, expiresAt }: Pick<PortalProps, 'token' | 'csrf' | 'expiresAt'>) {
  const { props } = usePage<{ errors?: Record<string, string> }>()
  const form = useForm({ password: '' })
  const error = form.errors.password ?? props.errors?.password
  const action = `/s/${token}/unlock`

  // With JS the form posts through Inertia; without it, it submits as a normal POST.
  const submit = (e: FormEvent) => {
    e.preventDefault()
    form.post(action, { preserveScroll: true, onSuccess: () => form.reset('password') })
  }

  return (
    <div className="grid min-h-[calc(100svh-4rem)] place-items-center px-4 pb-16">
      <div className="[--crop-offset:12px]">
        <CropFrame tick={24} className="w-[min(520px,92vw)]">
          <div className="flex overflow-hidden rounded-lg border border-border-raised bg-surface-raised shadow-[var(--shadow-raised)]">
            <div className="flex min-w-0 flex-1 flex-col gap-5 p-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Private preview
                </p>
                <h1 className="mt-1 font-display text-[32px]/10 font-semibold">
                  Work selected for you
                </h1>
              </div>
              <form method="post" action={action} onSubmit={submit} className="flex flex-col gap-4">
                <input type="hidden" name="_csrf" value={csrf} />
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="portal-password" className="text-[13px]/[18px] font-medium">
                    Password
                  </label>
                  <input
                    id="portal-password"
                    name="password"
                    type="password"
                    required
                    autoFocus
                    autoComplete="current-password"
                    maxLength={128}
                    value={form.data.password}
                    onChange={(e) => form.setData('password', e.target.value)}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'portal-password-error' : undefined}
                    className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-sm"
                  />
                  <div role="alert">
                    {error && (
                      <p id="portal-password-error" className="text-xs text-error">
                        {error}
                      </p>
                    )}
                  </div>
                </div>
                <button type="submit" disabled={form.processing} className={primaryBtn}>
                  View work <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
                </button>
              </form>
            </div>
            <div className="relative flex w-[var(--stub-width)] shrink-0 flex-col items-center justify-center gap-2 px-3 text-center max-sm:hidden">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-px [background:repeating-linear-gradient(180deg,var(--border-raised)_0_4px,transparent_4px_8px)]"
              />
              <Lock size={20} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em]">
                Private
              </p>
              {expiresAt && (
                <p className="font-mono text-[11px] uppercase text-muted-foreground">
                  {shortDate(expiresAt)}
                </p>
              )}
            </div>
          </div>
        </CropFrame>
      </div>
    </div>
  )
}

/** The share's own covers as a 2×3 contact sheet; frames without a cover stay blank. */
function HeroSheet({ studies }: { studies: Card[] }) {
  const frames = studies.slice(0, 6)
  return (
    <CropFrame tick={20}>
      <ol className="grid grid-cols-3 gap-0.5 rounded-[6px] bg-surface-raised p-0.5">
        {frames.map((s, i) => (
          <li key={s.slug}>
            <div className="aspect-[4/3] overflow-hidden bg-secondary">
              {s.cover && (
                <img
                  src={s.cover}
                  alt=""
                  width={400}
                  height={300}
                  fetchPriority={i < 3 ? 'high' : 'auto'}
                  className="size-full object-cover"
                />
              )}
            </div>
            <p className="py-1 text-center font-mono text-[10px] text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </p>
          </li>
        ))}
      </ol>
    </CropFrame>
  )
}

function Gallery({ name, studies, expiresAt, token, owner }: PortalProps) {
  const [filter, setFilter] = useState<string | null>(null)
  const categories = useMemo(
    () => [...new Set(studies.flatMap((s) => s.categories))].sort(),
    [studies]
  )
  const shown = filter ? studies.filter((s) => s.categories.includes(filter)) : studies
  const first = studies[0]
  const contact = contactHref(owner, `Questions about ${name}`)

  return (
    <>
      <Head title={name} />
      <section className="grid items-center gap-10 px-6 pb-16 pt-4 lg:min-h-[72svh] lg:grid-cols-12 xl:px-12">
        <div className="flex flex-col items-start gap-5 lg:col-span-6">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
            {studies.length} case {studies.length === 1 ? 'study' : 'studies'}
          </p>
          <h1 className="font-display text-[clamp(2.25rem,1.5rem+2.4vw,3.75rem)] font-semibold leading-[1.05]">
            {name}
          </h1>
          {expiresAt && (
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground sm:hidden">
              <Clock size={16} strokeWidth={1.75} aria-hidden />
              Available until {shortDate(expiresAt)}
            </p>
          )}
          <p className="max-w-[52ch] text-lg/7 text-muted-foreground">
            A private selection of recent work from Digital Covet, prepared for you.
          </p>
          <Link href={`/s/${token}/${first.slug}`} className={primaryBtn}>
            Start with {first.title} <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
        <div className="lg:col-span-6 lg:-mr-[10%]">
          <HeroSheet studies={studies} />
        </div>
      </section>

      <section aria-label="Case studies" className="mx-auto max-w-[1280px] px-6 pb-24 xl:px-12">
        {studies.length >= 9 && categories.length > 0 && (
          <div role="group" aria-label="Filter by category" className="mb-8 flex flex-wrap gap-2">
            {[null, ...categories].map((c) => (
              <button
                key={c ?? 'all'}
                type="button"
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-foreground"
              >
                {c ?? 'All'}
              </button>
            ))}
          </div>
        )}
        <ul className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <li key={s.slug} className="portal-reveal">
              <Link href={`/s/${token}/${s.slug}`} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface-raised">
                  {s.cover && (
                    <img
                      src={s.cover}
                      alt=""
                      width={640}
                      height={480}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Folio n={s.folio} />
                  {s.categories[0] && <span>· {s.categories[0]}</span>}
                </div>
                <h2 className="mt-1 font-display text-xl/7 font-semibold group-hover:underline">
                  {s.title}
                </h2>
                <p className="text-sm text-muted-foreground">{s.client}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border px-6 py-16 text-center xl:px-12">
        <p className="font-display text-xl/7 font-semibold">Questions about this work?</p>
        {contact && (
          <a href={contact} className={`${secondaryBtn} mt-4`}>
            <Mail size={16} strokeWidth={1.75} aria-hidden /> Contact Digital Covet
          </a>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Shared privately — please don’t forward.
        </p>
      </footer>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function Portal(props: PortalProps) {
  switch (props.state) {
    case 'gate':
      return (
        <>
          <Head title="Private preview" />
          <Gate token={props.token} csrf={props.csrf} expiresAt={props.expiresAt} />
        </>
      )
    case 'gallery':
      return <Gallery {...props} />
    default:
      return (
        <>
          <Head title="Link unavailable" />
          <Dead state={props.state} owner={props.owner} />
        </>
      )
  }
}

Portal.layout = [PortalLayout]
