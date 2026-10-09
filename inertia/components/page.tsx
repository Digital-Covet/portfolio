import { Head } from '@inertiajs/react'
import type { ReactNode } from 'react'

type PageProps = {
  title: string
  description?: string
  /** Breadcrumb / eyebrow line, shown above the title. */
  eyebrow?: ReactNode
  /** Right-aligned actions: max one primary, one secondary, one overflow menu. */
  actions?: ReactNode
  /** Sets the document title only; the visible header is omitted. */
  hideTitle?: boolean
  /** Content width cap: 1280 (default) or 1440 for lists and tables. */
  wide?: boolean
  children?: ReactNode
}

export default function Page({
  title,
  description,
  eyebrow,
  actions,
  hideTitle,
  wide,
  children,
}: PageProps) {
  return (
    <>
      <Head title={title} />
      <div
        className="mx-auto w-full"
        style={{ maxWidth: wide ? 'var(--container-wide)' : 'var(--container)' }}
      >
        {hideTitle ? (
          <h1 className="sr-only">{title}</h1>
        ) : (
          <header className="flex min-h-16 flex-wrap items-start justify-between gap-4 pb-4 pt-6 max-md:pl-12">
            <div className="min-w-0">
              {eyebrow && <div className="mb-1 text-xs text-muted-foreground">{eyebrow}</div>}
              <h1 className="font-display text-2xl/8 font-semibold">{title}</h1>
              {description && (
                <p className="mt-1 max-w-[var(--prose)] text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </header>
        )}
        {children}
      </div>
    </>
  )
}
