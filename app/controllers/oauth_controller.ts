import { createHmac, timingSafeEqual } from 'node:crypto'
import User from '#models/user'
import {
  buildAuthorizeUrl,
  createPkcePair,
  createState,
  exchangeCodeForTokens,
  fetchUserInfo,
  hasPortfolioAccess,
  toIdentityRole,
} from '#services/iam_oauth_service'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

const STATE_COOKIE = 'iam_oauth_state'
const VERIFIER_COOKIE = 'iam_oauth_verifier'

function decodeLogoutTokenPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export default class OauthController {
  async redirect({ response }: HttpContext) {
    const { verifier, challenge } = createPkcePair()
    const state = createState()

    response.plainCookie(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    })
    response.plainCookie(VERIFIER_COOKIE, verifier, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    })

    return response.redirect(buildAuthorizeUrl(state, challenge))
  }

  async callback(ctx: HttpContext) {
    const { request, response, auth, session, inertia } = ctx
    const code = request.input('code')
    const returnedState = request.input('state')
    const error = request.input('error')
    const errorDescription = request.input('error_description')

    if (error || !code) {
      session.flash('errors', {
        email: errorDescription || 'Sign in with Covet ID was cancelled.',
      })
      return response.redirect().toRoute('session.create')
    }

    const expectedState = request.plainCookie(STATE_COOKIE)
    const verifier = request.plainCookie(VERIFIER_COOKIE)
    response.clearCookie(STATE_COOKIE, { path: '/' })
    response.clearCookie(VERIFIER_COOKIE, { path: '/' })

    if (!expectedState || !verifier || expectedState !== returnedState) {
      session.flash('errors', { email: 'Invalid OAuth state. Please try again.' })
      return response.redirect().toRoute('session.create')
    }

    let userinfo
    try {
      const tokens = await exchangeCodeForTokens(code, verifier)
      userinfo = await fetchUserInfo(tokens.access_token)
    } catch (e) {
      ctx.logger.error({ err: e }, 'IAM OAuth callback failed')
      session.flash('errors', { email: 'Could not complete Covet ID sign-in.' })
      return response.redirect().toRoute('session.create')
    }

    if (!userinfo.email) {
      session.flash('errors', { email: 'IAM account has no email address.' })
      return response.redirect().toRoute('session.create')
    }

    if (!hasPortfolioAccess(userinfo)) {
      response.status(403)
      return inertia.render('errors/forbidden', {
        message: 'Your account does not have access to Portfolio.',
      })
    }

    const role = toIdentityRole(userinfo.role)
    const appAccess = Array.isArray(userinfo.app_access) ? userinfo.app_access : []

    let user =
      (await User.findBy('iamSub', userinfo.sub)) ?? (await User.findBy('email', userinfo.email))

    if (user) {
      user.merge({
        iamSub: userinfo.sub,
        email: userinfo.email,
        fullName: userinfo.name ?? user.fullName,
        role,
        appAccess: JSON.stringify(appAccess),
        avatarUrl: userinfo.picture ?? user.avatarUrl,
        emailVerified: userinfo.email_verified === true,
        departmentId: userinfo.department_id ?? user.departmentId,
      })
      await user.save()
    } else {
      user = await User.create({
        iamSub: userinfo.sub,
        email: userinfo.email,
        fullName: userinfo.name ?? userinfo.email.split('@')[0],
        password: null,
        role,
        appAccess: JSON.stringify(appAccess),
        avatarUrl: userinfo.picture ?? null,
        emailVerified: userinfo.email_verified === true,
        departmentId: userinfo.department_id ?? null,
      })
    }

    await auth.use('web').login(user)
    return response.redirect().toRoute('dashboard')
  }

  async frontChannelLogout({ request, response, auth }: HttpContext) {
    const logoutToken = request.input('logout_token')
    const rawSecret = env.get('FRONT_CHANNEL_LOGOUT_SECRET')
    const secret = typeof rawSecret === 'string' ? rawSecret : rawSecret?.release()

    if (logoutToken && secret) {
      const [header, payload, signature] = logoutToken.split('.')
      if (header && payload && signature) {
        const expected = createHmac('sha256', secret)
          .update(`${header}.${payload}`)
          .digest('base64url')
        try {
          if (
            signature.length === expected.length &&
            timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
          ) {
            const claims = decodeLogoutTokenPayload(logoutToken)
            const sid = typeof claims?.sid === 'string' ? claims.sid : undefined
            if (sid) {
              await auth.use('web').logout()
            } else {
              await auth.use('web').logout()
            }
            return response.ok({ received: true })
          }
        } catch {
          // fall through to local logout
        }
      }
    }

    // No (valid) token: still end local session so single logout always works.
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
