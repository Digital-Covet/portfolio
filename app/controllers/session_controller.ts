import type { HttpContext } from '@adonisjs/core/http'
import { logoutUrl } from '#services/iam_oauth'

/**
 * Sign-in goes through IAM (see OAuthController); signing out ends the local
 * session and then IAM's, so the next visit does not silently sign back in.
 */
export default class SessionController {
  async destroy({ response, auth, session }: HttpContext) {
    const idToken = session.get('iam_id_token') as string | undefined
    await auth.use('web').logout()
    return response.redirect(logoutUrl(idToken ?? null))
  }
}
