import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { getSessionRole, hasPortfolioAccessFromSession } from '#services/portfolio_auth'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 *
 * IAM-only: after the session guard authenticates, the request must also
 * carry IAM claims (`iam_role` + `iam_app_access` with Portfolio) stored
 * at OAuth login. Legacy local-password sessions have no IAM claims and
 * are logged out + sent back through Covet ID instead of being treated
 * as employees.
 */
export default class AuthMiddleware {
  /**
   * The URL to redirect to, when authentication fails
   */
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    const role = getSessionRole(ctx)
    if (!role || !hasPortfolioAccessFromSession(ctx)) {
      await ctx.auth.use('web').logout()
      return ctx.response.redirect().toRoute('oauth.redirect')
    }

    return next()
  }
}
