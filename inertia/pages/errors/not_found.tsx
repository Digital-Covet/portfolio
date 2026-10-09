import { ArrowLeft } from 'lucide-react'
import ErrorPage, { EmptyFrameIllustration, actionClass } from '~/components/error_page'

/** `portal` is set for share-portal URLs, where recipients have no workspace to return to. */
export default function NotFound({ portal = false }: { portal?: boolean }) {
  return (
    <ErrorPage
      title="Page not found"
      status={404}
      heading="This page doesn't exist."
      illustration={<EmptyFrameIllustration />}
      action={
        portal ? undefined : (
          <a href="/dashboard" className={actionClass}>
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
            Back to dashboard
          </a>
        )
      }
    />
  )
}
