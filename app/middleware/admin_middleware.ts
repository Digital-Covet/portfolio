import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Library pages (clients, taxonomies) are for admin and superadmin only. The nav hides
 * them from staff, so a direct URL gets a plain 403 instead of a disabled affordance.
 * Must run after the auth middleware.
 */
export default class AdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const role = auth.user?.role
    if (role !== 'admin' && role !== 'superadmin') {
      return response.forbidden('You don’t have access to this page.')
    }
    return next()
  }
}
