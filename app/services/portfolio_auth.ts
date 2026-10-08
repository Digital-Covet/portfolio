import type { HttpContext } from '@adonisjs/core/http'

export const IAM_ROLE_KEY = 'iam_role'
export const IAM_APP_ACCESS_KEY = 'iam_app_access'

export const IDENTITY_ROLES = ['employee', 'admin', 'superadmin'] as const
export type IdentityRole = (typeof IDENTITY_ROLES)[number]

const RANK = { employee: 0, admin: 1, superadmin: 2 } as const

export function isIdentityRole(value: unknown): value is IdentityRole {
  return typeof value === 'string' && (IDENTITY_ROLES as readonly string[]).includes(value)
}

/**
 * Strict role parsing for authorization decisions.
 * Returns null instead of falling back to 'employee' so a missing /
 * forged / unknown role can never grant access.
 * Accepts IAM label casing ("Employee", " Admin ") by normalizing to the
 * canonical lowercase value; anything else stays null (fail-closed).
 */
export function toIdentityRoleStrict(value: unknown): IdentityRole | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return isIdentityRole(normalized) ? normalized : null
}

function readSession(ctx: Pick<HttpContext, 'session'>, key: string): unknown {
  try {
    return ctx.session.get(key)
  } catch {
    return undefined
  }
}

export function getSessionRole(ctx: Pick<HttpContext, 'session'>): IdentityRole | null {
  return toIdentityRoleStrict(readSession(ctx, IAM_ROLE_KEY))
}

export function getSessionAppAccess(ctx: Pick<HttpContext, 'session'>): string[] {
  const raw = readSession(ctx, IAM_APP_ACCESS_KEY)
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
}

/**
 * Single source of truth for Portfolio access.
 * IAM already expands elevated roles to ALL_APPS in `app_access`,
 * so we only check the claim — never the role name. A forged
 * `role: admin` without `Portfolio` in `app_access` is denied.
 */
export function hasPortfolioAccessFromSession(ctx: Pick<HttpContext, 'session'>): boolean {
  return getSessionAppAccess(ctx).includes('Portfolio')
}

export function isAdminSession(ctx: Pick<HttpContext, 'session'>): boolean {
  const role = getSessionRole(ctx)
  return role !== null && (RANK[role] ?? 0) >= RANK.admin
}

export function storeIamSession(
  ctx: Pick<HttpContext, 'session'>,
  role: IdentityRole,
  appAccess: string[]
) {
  ctx.session.put(IAM_ROLE_KEY, role)
  ctx.session.put(IAM_APP_ACCESS_KEY, [...appAccess])
}

export function clearIamSession(ctx: Pick<HttpContext, 'session' | 'auth'>) {
  try {
    ctx.session.forget(IAM_ROLE_KEY)
    ctx.session.forget(IAM_APP_ACCESS_KEY)
  } catch {
    // session may already be torn down during front-channel logout
  }
}
