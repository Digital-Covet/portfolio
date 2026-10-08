import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ response }: HttpContext) {
    // IAM-only sign-in. Local signup is disabled.
    return response.redirect().toRoute('oauth.redirect')
  }

  async store({ response }: HttpContext) {
    // IAM-only sign-in. Local signup is disabled.
    return response.redirect().toRoute('oauth.redirect')
  }
}
