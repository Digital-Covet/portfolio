import { Effect } from 'effect'
import type { HttpContext } from '@adonisjs/core/http'
import { AuthService } from '#services/auth_service'

/**
 * Runs an Effect requiring AuthService inside an HTTP request.
 *
 * - Provides the production layer (`AuthService.Live`, which already
 *   includes the Lucid-backed UserRepository).
 * - Annotates Effect logs with the HTTP method and URL so log lines
 *   can be correlated with Adonis request logs.
 * - Rejects with the typed failure on `Fail` (controllers map these
 *   to redirects) and throws on `Die` (handled by the exception handler).
 */
export function runRequestEffect<A, E>(
  ctx: HttpContext,
  effect: Effect.Effect<A, E, AuthService>
): Promise<A> {
  return Effect.runPromise(
    effect.pipe(
      Effect.provide(AuthService.Live),
      Effect.annotateLogs({
        httpMethod: ctx.request.method(),
        httpUrl: ctx.request.url(),
      })
    )
  )
}
