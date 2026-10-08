import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Page from '~/components/page'
import CovetGrid from '~/components/covet_grid'

export default function Forbidden({ message }: { message?: string }) {
  return (
    <Page title="No access" hideTitle>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--hairline)',
          background: 'var(--card)',
          padding: 48,
          maxWidth: 480,
        }}
      >
        <CovetGrid style={{ height: 160, inset: 'auto', top: 0, left: 0, right: 0 }} />
        <div style={{ position: 'relative' }}>
          <h1 className="page__title" style={{ marginBottom: 8 }}>
            You don&apos;t have access to this page
          </h1>
          <p className="page__description" style={{ marginBottom: 24 }}>
            {message ?? 'Your account does not have access to Portfolio.'}
          </p>
          <Link route="dashboard" className="btn btn--primary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </Page>
  )
}

Forbidden.layout = [AppLayout]
