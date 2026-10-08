import { Context, Effect, Layer } from 'effect'
import User from '#models/user'
import { EmailAlreadyTaken, InvalidCredentials, UserCreationFailed } from '#errors/auth'

export interface SignupInput {
  readonly fullName: string | null
  readonly email: string
  readonly password: string
}

/**
 * Maps unknown persistence errors to a readable reason without
 * leaking driver internals to callers.
 */
function toReason(cause: unknown): string {
  if (cause instanceof Error && cause.message) {
    return cause.message
  }
  try {
    return JSON.stringify(cause) ?? 'Unknown database error'
  } catch {
    return 'Unknown database error'
  }
}

/**
 * Detects unique-constraint violations across drivers (sqlite/postgres).
 * Used to turn a signup race into EmailAlreadyTaken instead of a 500.
 */
function isUniqueViolation(cause: unknown): boolean {
  if (typeof cause !== 'object' || cause === null) {
    return false
  }
  const record = cause as Record<string, unknown>
  const haystack = [record.code, record.errno, record.message]
    .map((part) => String(part ?? ''))
    .join(' ')
    .toUpperCase()
  return (
    haystack.includes('UNIQUE') ||
    haystack.includes('DUPLICATE') ||
    haystack.includes('SQLITE_CONSTRAINT')
  )
}

const verifyCredentials = (email: string, password: string) =>
  Effect.tryPromise(() => User.verifyCredentials(email, password)).pipe(
    Effect.mapError(() => new InvalidCredentials({ email }))
  )

const createUser = (input: SignupInput) =>
  Effect.gen(function* () {
    const existing = yield* Effect.tryPromise(() => User.findBy('email', input.email)).pipe(
      Effect.mapError(
        (cause) => new UserCreationFailed({ email: input.email, reason: toReason(cause) })
      )
    )

    if (existing) {
      return yield* new EmailAlreadyTaken({ email: input.email })
    }

    return yield* Effect.tryPromise(() =>
      User.create({
        fullName: input.fullName,
        email: input.email,
        password: input.password,
      })
    ).pipe(
      Effect.mapError((cause) =>
        isUniqueViolation(cause)
          ? new EmailAlreadyTaken({ email: input.email })
          : new UserCreationFailed({ email: input.email, reason: toReason(cause) })
      )
    )
  })

/**
 * Persistence boundary for user records.
 *
 * Keeps all Lucid calls in one place so the rest of the app only
 * deals with typed Effect failures.
 */
export class UserRepository extends Context.Service<UserRepository>()('app/UserRepository', {
  make: Effect.succeed({ verifyCredentials, createUser }),
}) {
  static readonly Live = Layer.effect(this, this.make)
}
