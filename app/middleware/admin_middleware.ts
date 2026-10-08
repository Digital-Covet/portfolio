import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

const RANK = { employee: 0, admin: 1, superadmin: 2 } as const
type Role = keyof typeof RANK

export function isAdminRole(role: unknown): boolean {
  return (RANK[role as Role] ?? 0) >= RANK.admin
}

/**
 * Admin middleware. Requires a signed-in user whose IAM-synced role is
 * admin or superadmin. Employees are redirected to /dashboard (no local
 * credentials, no IAM round-trip — role is read from the session user).
 */
export default class AdminMiddleware {
  redirectTo = '/dashboard'

  async handle(ctx: HttpContext, next: NextFn) {
    const role = (ctx.auth.user as unknown as { role?: unknown } | null)?.role
    if (!isAdminRole(role)) {
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
