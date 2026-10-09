import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Keeps every response out of search indexes and stops share tokens in
 * `/s/:token` URLs from leaking through the Referer header.
 *
 * Runs before the static middleware, so it covers assets and redirects too.
 */
export default class RobotsMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    response.header('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.header('Referrer-Policy', 'same-origin')

    return next()
  }
}
