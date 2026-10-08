import { test } from '@japa/runner'
import { Effect } from 'effect'
import testUtils from '@adonisjs/core/services/test_utils'
import { AuthService } from '#services/auth_service'
import { EmailAlreadyTaken, InvalidCredentials } from '#errors/auth'

/**
 * Covers the Effect-based auth foundation (services + layers +
 * tagged errors) against the real sqlite database.
 */
test.group('AuthService (Effect)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('signup creates a user', async ({ assert }) => {
    const user = await Effect.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService
        return yield* auth.signup({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'password123',
        })
      }).pipe(Effect.provide(AuthService.Live))
    )

    assert.equal(user.email, 'ada@example.com')
    assert.equal(user.fullName, 'Ada Lovelace')
  })

  test('duplicate signup fails with EmailAlreadyTaken', async ({ assert }) => {
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService
        yield* auth.signup({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'password123',
        })
        return yield* auth.signup({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'password123',
        })
      }).pipe(Effect.provide(AuthService.Live), Effect.flip)
    )

    assert.instanceOf(error, EmailAlreadyTaken)
  })

  test('login with correct credentials returns the user', async ({ assert }) => {
    const user = await Effect.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService
        yield* auth.signup({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'password123',
        })
        return yield* auth.verifyLogin('ada@example.com', 'password123')
      }).pipe(Effect.provide(AuthService.Live))
    )

    assert.equal(user.email, 'ada@example.com')
  })

  test('login with wrong password fails with InvalidCredentials', async ({ assert }) => {
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService
        yield* auth.signup({
          fullName: 'Ada Lovelace',
          email: 'ada@example.com',
          password: 'password123',
        })
        return yield* auth.verifyLogin('ada@example.com', 'wrong-password')
      }).pipe(Effect.provide(AuthService.Live), Effect.flip)
    )

    assert.instanceOf(error, InvalidCredentials)
  })

  test('login for unknown email fails with InvalidCredentials', async ({ assert }) => {
    const error = await Effect.runPromise(
      Effect.gen(function* () {
        const auth = yield* AuthService
        return yield* auth.verifyLogin('ghost@example.com', 'password123')
      }).pipe(Effect.provide(AuthService.Live), Effect.flip)
    )

    assert.instanceOf(error, InvalidCredentials)
  })
})
