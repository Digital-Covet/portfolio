import { FolderOpen } from 'lucide-react'
import Page from '~/components/page'
import AppLayout from '~/layouts/app'

/** Stand-in for sections that have a nav entry but no page yet. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <Page title={title}>
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-16 text-center">
        <FolderOpen size={20} strokeWidth={1.75} className="text-muted-foreground" aria-hidden />
        <h2 className="font-display text-xl/7 font-semibold">{title} isn&apos;t built yet</h2>
        <p className="max-w-[var(--prose)] text-sm text-muted-foreground">
          This route exists so the navigation can be exercised. Replace this page when the section
          is implemented.
        </p>
      </div>
    </Page>
  )
}

Placeholder.layout = [AppLayout]
