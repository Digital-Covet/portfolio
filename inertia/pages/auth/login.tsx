import { useState } from 'react'
import { Head, usePage } from '@inertiajs/react'
import { Info, Loader2, OctagonX, ShieldCheck } from 'lucide-react'
import AuthLayout from '~/layouts/auth'

/**
 * Sign-in (Utility): single IAM redirect. Spec §6.3 — 400px card on the
 * Covet Grid, one primary action, generic failure copy (never leaks why
 * an account failed).
 */
export default function Login() {
  const { props, flash } = usePage()
  const validationErrors = (props as { errors?: Record<string, string> }).errors ?? {}
  const iamError = validationErrors.email ?? validationErrors.error
  const flashError = (flash as { error?: string }).error
  const flashSuccess = (flash as { success?: string }).success

  const [starting, setStarting] = useState(false)

  const showSessionEnded =
    !iamError &&
    !flashError &&
    typeof flashSuccess === 'string' &&
    /session|sign in again|logged out/i.test(flashSuccess)
  const showGenericError = Boolean(iamError || flashError) && !showSessionEnded

  function startIam() {
    if (starting) return
    setStarting(true)
    window.location.assign('/auth/iam')
  }

  return (
    <>
      <Head title="Sign in" />

      <p className="telemetry-label" style={{ margin: '0 0 8px' }}>
        Digital Covet · Portfolio
      </p>
      <h1 className="auth__title">Sign in</h1>
      <p className="auth__sub">Internal workspace for the Digital Covet team.</p>

      {showSessionEnded && flashSuccess && (
        <div className="auth__alert auth__alert--info" role="status">
          <Info size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Your session ended. Sign in again.</span>
        </div>
      )}

      {showGenericError && (
        <div className="auth__alert auth__alert--error" role="alert">
          <OctagonX size={16} strokeWidth={1.75} aria-hidden="true" />
          <span>Couldn&rsquo;t sign you in. Try again.</span>
        </div>
      )}

      <div className="auth__form">
        <button
          type="button"
          onClick={startIam}
          disabled={starting}
          aria-busy={starting ? 'true' : 'false'}
          className="btn btn--primary btn--block auth__iam"
          style={{ height: 48 }}
        >
          {starting ? (
            <>
              <Loader2 size={20} strokeWidth={1.75} aria-hidden="true" className="auth__spin" />
              Signing you in…
            </>
          ) : (
            <>
              <ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" />
              Continue with Digital Covet IAM
            </>
          )}
        </button>
      </div>

      <p className="auth__foot telemetry-label" style={{ marginTop: 20 }}>
        SSO · OIDC + PKCE
      </p>

      <style>{`
        .auth__iam:disabled { opacity: 1; }
        .auth__spin { animation: auth-spin 1s linear infinite; }
        @keyframes auth-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .auth__spin { animation: none; } }
        .auth__alert {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 14px; line-height: 1.5;
          border: 1px solid var(--border-strong); border-radius: var(--radius);
          padding: 10px 12px; margin: 0 0 16px;
        }
        .auth__alert--error { color: var(--error); border-color: var(--error); }
        .auth__alert--info { color: var(--info); border-color: var(--info); }
        .auth__alert span { color: var(--fg-1); }
      `}</style>
    </>
  )
}

Login.layout = [AuthLayout]
