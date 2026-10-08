import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UserTransformer from '#transformers/user_transformer'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import { getSessionAppAccess, getSessionRole } from '#services/portfolio_auth'
import env from '#start/env'

type SharedUser = ReturnType<typeof UserTransformer.transform> & {
  role: string
  appAccess: string[]
}

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    /**
     * The share method is called everytime an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties
     */
    const { auth, request, session } = ctx as Partial<HttpContext>

    const theme: 'light' | 'dark' | 'system' =
      request?.plainCookie('app_theme', {
        defaultValue: 'dark',
        encoded: false,
      }) ?? 'dark'

    /**
     * Data shared with all Inertia pages. Make sure you are using
     * transformers for rich data-types like Models.
     */
    const iamBase = env.get('IAM_BASE_URL').replace(/\/$/, '')

    // IAM is the sole authority for role/appAccess. They come from the
    // session claims stored at OAuth login — never from the users table.
    // Missing claims fall back to least-privilege for display; the server
    // middlewares still deny access.
    let sharedUser: SharedUser | undefined
    if (auth?.user) {
      const base = UserTransformer.transform(auth.user)
      let role: string | null = null
      let appAccess: string[] = []
      try {
        if (session) {
          role = getSessionRole({ session } as HttpContext)
          appAccess = getSessionAppAccess({ session } as HttpContext)
        }
      } catch {
        role = null
        appAccess = []
      }
      sharedUser = { ...base, role: role ?? 'employee', appAccess }
    }

    return {
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      user: ctx.inertia.always(sharedUser),
      preferences: ctx.inertia.always({ theme }),
      iamAccountUrl: ctx.inertia.always(`${iamBase}/account`),
    }
  }

  flash(ctx: HttpContext) {
    /**
     * Flash messages travel in the dedicated `flash` field of the page
     * object instead of props, and the client strips them from history
     * state so they never reappear when navigating back.
     */
    const { session } = ctx as Partial<HttpContext>

    const success: string | undefined = session?.flashMessages.get('success')
    const error: string | undefined = session?.flashMessages.get('error')

    return { success, error }
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)

    const output = await next()
    this.dispose(ctx)

    return output
  }
}

declare module '@adonisjs/inertia/types' {
  type MiddlewareSharedProps = InferSharedProps<InertiaMiddleware>
  export interface SharedProps extends MiddlewareSharedProps {}
}
