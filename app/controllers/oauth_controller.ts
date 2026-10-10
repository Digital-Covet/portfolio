import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { APP_SLUG, createAuthorization, exchangeCode, fetchProfile } from '#services/iam_oauth'
import { syncAppUser } from '#services/user_sync'

const PENDING_KEY = 'iam_oauth'

type Pending = { state: string; verifier: string }

/**
 * Sign-in through Digital Covet ID. `redirect` starts the PKCE flow;
 * `callback` completes it and mirrors the IAM user into `app_user`.
 */
export default class OAuthController {
  async redirect({ session, response }: HttpContext) {
    const { url, state, verifier } = createAuthorization()
    session.put(PENDING_KEY, { state, verifier } satisfies Pending)
    return response.redirect(url)
  }

  async callback({ request, session, response, auth }: HttpContext) {
    const fail = (message: string) => {
      session.flash('error', message)
      return response.redirect().withQs(false).toPath('/login')
    }

    const pending = session.pull(PENDING_KEY) as Pending | undefined
    const { code, state, error } = request.qs()

    if (typeof error === 'string' && error) {
      return fail(
        error === 'access_denied'
          ? 'Sign-in was cancelled or you do not have access to Portfolio.'
          : 'Digital Covet ID could not sign you in. Try again.'
      )
    }
    if (!pending || typeof code !== 'string' || state !== pending.state) {
      return fail('Your sign-in session expired. Try again.')
    }

    try {
      const tokens = await exchangeCode(code, pending.verifier)
      const profile = await fetchProfile(tokens.accessToken)

      if (!profile.app_access?.includes(APP_SLUG)) {
        return fail('Your account does not have access to Portfolio.')
      }

      // IAM owns the role; Portfolio only accepts the values its table allows.
      const role = profile.role
      if (role !== 'employee' && role !== 'admin' && role !== 'superadmin') {
        return fail('Your account has no valid Portfolio role. Contact an administrator.')
      }

      const user = await syncAppUser(profile, role)
      if (!user) return fail('Your account does not have access to Portfolio.')

      await auth.use('web').login(user)
      if (tokens.idToken) session.put('iam_id_token', tokens.idToken)

      return response.redirect('/dashboard')
    } catch (err) {
      logger.error({ err }, 'IAM sign-in failed')
      return fail('Could not complete sign-in with Digital Covet ID. Try again.')
    }
  }
}
