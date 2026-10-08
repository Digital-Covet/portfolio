import { Data } from 'effect'

/**
 * Typed domain errors for the authentication flow.
 *
 * Controllers catch these by tag (via `instanceof`) and map them to
 * redirects with flashed errors. Anything else (defects) is rethrown
 * and handled by the global exception handler.
 */
export class InvalidCredentials extends Data.TaggedError('InvalidCredentials')<{
  readonly email: string
}> {}

export class EmailAlreadyTaken extends Data.TaggedError('EmailAlreadyTaken')<{
  readonly email: string
}> {}

export class UserCreationFailed extends Data.TaggedError('UserCreationFailed')<{
  readonly email: string
  readonly reason: string
}> {}

export type AuthError = InvalidCredentials | EmailAlreadyTaken | UserCreationFailed
