import AuthLayout from '~/layouts/auth'
import { Link } from '@adonisjs/inertia/react'

/**
 * Local sign-up is disabled. Accounts are provisioned in the central IAM
 * (iam-digitalcovet); this page only points back to IAM sign-in so old
 * bookmarks don't 404.
 */
export default function Signup() {
  return (
    <>
      <h1 className="auth__title">Sign-up is disabled</h1>
      <p className="auth__sub">Accounts are managed in Digital Covet IAM.</p>

      <div className="auth__form">
        <Link route="session.create" className="btn btn--primary btn--block">
          Continue with Digital Covet IAM
        </Link>
      </div>

      <p className="auth__foot">
        Already signed up?{' '}
        <Link route="session.create" className="il">
          Sign in
        </Link>
      </p>
    </>
  )
}

Signup.layout = [AuthLayout]
