import { RotateCw } from 'lucide-react'
import ErrorPage, { TornStubIllustration, actionClass } from '~/components/error_page'

export default function ServerError({ reference }: { reference?: string }) {
  return (
    <ErrorPage
      title="Something went wrong"
      status={500}
      heading="Something went wrong on our side."
      illustration={<TornStubIllustration />}
      action={
        <button type="button" onClick={() => window.location.reload()} className={actionClass}>
          <RotateCw size={16} strokeWidth={1.75} aria-hidden />
          Try again
        </button>
      }
      footnote={reference ? `Ref ${reference}` : undefined}
    />
  )
}
