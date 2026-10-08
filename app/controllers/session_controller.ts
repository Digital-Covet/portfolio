import { clearIamSession } from '#services/portfolio_auth'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ response }: HttpContext) {
    // IAM-only sign-in. Local password login is disabled: it bypassed IAM
    // and minted employee-role sessions for users not in IAM.
    return response.redirect().toRoute('oauth.redirect')
  }

  async destroy({ auth, response, session }: HttpContext) {
    clearIamSession({ session, auth } as HttpContext)
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
