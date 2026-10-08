import { createHmac, timingSafeEqual } from 'node:crypto'
import User from '#models/user'
import {
  buildAuthorizeUrl,
  createPkcePair,
  createState,
  exchangeCodeForTokens,
  fetchUserInfo,
} from '#services/iam_oauth_service'
import { storeIamSession, clearIamSession, toIdentityRoleStrict } from '#services/portfolio_auth'
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

    // IAM is the sole authority for authorization. A missing/unknown role
    // must deny — never fall back to 'employee' (that fallback is what let
    // non-IAM users appear as employees).
    const role = toIdentityRoleStrict(userinfo.role)
    if (!role || !userinfo.sub) {
      response.status(403)
      return inertia.render('errors/forbidden', {
        message: 'Your IAM account is missing required identity claims.',
      })
    }
    const appAccess = Array.isArray(userinfo.app_access) ? userinfo.app_access : []
    if (!appAccess.includes('Portfolio')) {
      response.status(403)
      return inertia.render('errors/forbidden', {
        message: 'Your account does not have access to Portfolio.',
      })
    }

    let user =
      (await User.findBy('iamSub', userinfo.sub)) ?? (await User.findBy('email', userinfo.email))

    if (user) {
      // Identity link must be stable: never adopt a different iamSub via a
      // mere email match. If the email row belongs to another identity,
      // deny instead of merging (prevents account takeover / resurrection
      // of a deleted IAM user that reuses an email).
      if (user.iamSub && user.iamSub !== userinfo.sub) {
        response.status(403)
        return inertia.render('errors/forbidden', {
          message: 'This email is already linked to a different Covet ID.',
        })
      }
      user.merge({
        iamSub: userinfo.sub,
        email: userinfo.email,
        fullName: userinfo.name ?? user.fullName,
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
        avatarUrl: userinfo.picture ?? null,
        emailVerified: userinfo.email_verified === true,
        departmentId: userinfo.department_id ?? null,
      })
    }

    storeIamSession({ session }, role, appAccess)
    await auth.use('web').login(user)
    return response.redirect().toRoute('dashboard')
  }

  async frontChannelLogout({ request, response, auth, session }: HttpContext) {
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
              clearIamSession({ session, auth } as HttpContext)
              await auth.use('web').logout()
            } else {
              clearIamSession({ session, auth } as HttpContext)
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
    clearIamSession({ session, auth } as HttpContext)
    await auth.use('web').logout()
    return response.redirect().toRoute('session.create')
  }
}
