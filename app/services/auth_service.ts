import { Context, Effect, Layer } from 'effect'
import type { SignupInput } from '#services/user_repository'
import { UserRepository } from '#services/user_repository'

/**
 * Application-level auth use cases.
 *
 * HTTP concerns (validation, session login, redirects) stay in the
 * controllers. This service only orchestrates the domain flow so it
 * remains framework-agnostic and unit-testable.
 */
export class AuthService extends Context.Service<AuthService>()('app/AuthService', {
  make: Effect.gen(function* () {
    const users = yield* UserRepository

    return {
      verifyLogin: (email: string, password: string) =>
        users.verifyCredentials(email, password).pipe(Effect.withLogSpan('auth.login')),
      signup: (input: SignupInput) =>
        users.createUser(input).pipe(Effect.withLogSpan('auth.signup')),
    }
  }),
}) {
  static readonly Live = Layer.effect(this, this.make).pipe(Layer.provide(UserRepository.Live))
}
