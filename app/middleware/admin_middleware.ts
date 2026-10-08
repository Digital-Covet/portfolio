import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { isAdminSession } from '#services/portfolio_auth'

/**
 * Admin middleware. Requires a signed-in user whose IAM session role is
 * admin or superadmin. The role is read from the session claims stored at
 * OAuth login (IAM truth) — never from the users table, which no longer
 * stores authorization data.
 */
export default class AdminMiddleware {
  redirectTo = '/dashboard'

  async handle(ctx: HttpContext, next: NextFn) {
    if (!isAdminSession(ctx)) {
      // API-style / JSON callers get a 403; page navigations redirect.
      const acceptsJson =
        ctx.request.header('accept')?.includes('application/json') ||
        ctx.request.header('x-requested-with') === 'XMLHttpRequest'
      if (acceptsJson && !ctx.request.header('x-inertia')) {
        return ctx.response.forbidden({ message: 'Admin access required' })
      }
      return ctx.response.redirect(this.redirectTo, true)
    }
    return next()
  }
}
