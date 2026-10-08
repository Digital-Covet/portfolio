import { test } from '@japa/runner'
import {
  clearIamSession,
  getSessionAppAccess,
  getSessionRole,
  hasPortfolioAccessFromSession,
  isAdminSession,
  storeIamSession,
  toIdentityRoleStrict,
} from '#services/portfolio_auth'
import { hasPortfolioAccess } from '#services/iam_oauth_service'

function memorySession() {
  const store = new Map<string, unknown>()
  return {
    get: (key: string) => store.get(key),
    put: (key: string, value: unknown) => store.set(key, value),
    forget: (key: string) => store.delete(key),
  } as unknown as import('@adonisjs/core/http').HttpContext['session']
}

test.group('Portfolio IAM authz (fail-closed)', () => {
  test('unknown or missing role never falls back to employee', ({ assert }) => {
    assert.isNull(toIdentityRoleStrict(undefined))
    assert.isNull(toIdentityRoleStrict(''))
    assert.isNull(toIdentityRoleStrict('Employee'))
    assert.isNull(toIdentityRoleStrict('forged-admin'))
    assert.strictEqual(toIdentityRoleStrict('employee'), 'employee')
    assert.strictEqual(toIdentityRoleStrict('admin'), 'admin')
    assert.strictEqual(toIdentityRoleStrict('superadmin'), 'superadmin')
  })

  test('portfolio access requires the Portfolio claim for every role', ({ assert }) => {
    assert.isTrue(hasPortfolioAccess({ sub: '1', email: 'a@x.com', app_access: ['Portfolio'] }))
    assert.isTrue(
      hasPortfolioAccess({ sub: '1', email: 'a@x.com', role: 'admin', app_access: ['Portfolio'] })
    )
    // No role bypass: forged admin without the claim is denied.
    assert.isFalse(
      hasPortfolioAccess({ sub: '1', email: 'a@x.com', role: 'admin', app_access: [] })
    )
    assert.isFalse(
      hasPortfolioAccess({ sub: '1', email: 'a@x.com', role: 'superadmin', app_access: ['Share'] })
    )
    assert.isFalse(hasPortfolioAccess({ sub: '1', email: 'a@x.com' }))
  })

  test('session claims round-trip and admin check reads IAM truth', ({ assert }) => {
    const session = memorySession()
    const ctx = { session } as unknown as import('@adonisjs/core/http').HttpContext

    assert.isNull(getSessionRole(ctx))
    assert.isFalse(hasPortfolioAccessFromSession(ctx))
    assert.isFalse(isAdminSession(ctx))

    storeIamSession(ctx, 'employee', ['Portfolio'])
    assert.strictEqual(getSessionRole(ctx), 'employee')
    assert.deepEqual(getSessionAppAccess(ctx), ['Portfolio'])
    assert.isTrue(hasPortfolioAccessFromSession(ctx))
    assert.isFalse(isAdminSession(ctx))

    storeIamSession(ctx, 'admin', ['Share', 'Portfolio', 'Desk'])
    assert.isTrue(isAdminSession(ctx))

    clearIamSession(ctx)
    assert.isNull(getSessionRole(ctx))
    assert.isFalse(isAdminSession(ctx))
  })
})
