import { ArrowLeft } from 'lucide-react'
import ErrorPage, { EmptyFrameIllustration, actionClass } from '~/components/error_page'

export default function Forbidden() {
  return (
    <ErrorPage
      title="No access"
      status={403}
      heading="You don't have access to this page."
      illustration={<EmptyFrameIllustration />}
      action={
        // Full navigation: the error response is not part of the client-side page stack.
        <a href="/dashboard" className={actionClass}>
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          Back to dashboard
        </a>
      }
    />
  )
}
