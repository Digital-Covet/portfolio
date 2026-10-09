import { createHash, randomBytes } from 'node:crypto'
import env from '#start/env'

/**
 * Client for the Digital Covet ID (IAM) OAuth 2.0 / OIDC provider:
 * authorization-code grant with PKCE (S256), client_secret_basic at the token endpoint.
 */

const SCOPES = 'openid profile entitlements roles'

/** IAM's app slug; `app_access` in the userinfo response must include it. */
export const APP_SLUG = 'portfolio'

export type IamProfile = {
  sub: string
  name?: string | null
  email: string
  email_verified?: boolean
  picture?: string | null
  app_access?: string[]
  role?: string
}

export type IamTokens = { accessToken: string; idToken: string | null }

const base64url = (buf: Buffer) => buf.toString('base64url')
const iamUrl = (path: string) => `${env.get('IAM_URL').replace(/\/$/, '')}${path}`

export const redirectUri = () => `${env.get('APP_URL').replace(/\/$/, '')}/auth/callback`
export const postLogoutUri = () => `${env.get('APP_URL').replace(/\/$/, '')}/login`

export function createAuthorization() {
  const state = base64url(randomBytes(24))
  const nonce = base64url(randomBytes(24))
  const verifier = base64url(randomBytes(48))
  const challenge = base64url(createHash('sha256').update(verifier).digest())

  const url = new URL(iamUrl('/oauth/authorize'))
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: env.get('IAM_CLIENT_ID'),
    redirect_uri: redirectUri(),
    scope: SCOPES,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString()

  return { url: url.toString(), state, nonce, verifier }
}

export async function exchangeCode(code: string, verifier: string): Promise<IamTokens> {
  const basic = Buffer.from(
    `${encodeURIComponent(env.get('IAM_CLIENT_ID'))}:${encodeURIComponent(env.get('IAM_CLIENT_SECRET').release())}`
  ).toString('base64')

  const res = await fetch(iamUrl('/oauth/token'), {
    method: 'POST',
    headers: {
      'authorization': `Basic ${basic}`,
      'content-type': 'application/x-www-form-urlencoded',
      'accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok || typeof body.access_token !== 'string') {
    throw new Error(`token exchange failed: ${String(body.error ?? res.status)}`)
  }
  return {
    accessToken: body.access_token,
    idToken: typeof body.id_token === 'string' ? body.id_token : null,
  }
}

/** Fetched over the back channel with the access token, so the claims come straight from IAM. */
export async function fetchProfile(accessToken: string): Promise<IamProfile> {
  const res = await fetch(iamUrl('/oauth/userinfo'), {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  })
  const body = (await res.json().catch(() => ({}))) as Partial<IamProfile>
  if (!res.ok || !body.sub || !body.email) throw new Error(`userinfo failed: ${res.status}`)
  return body as IamProfile
}

export function logoutUrl(idToken: string | null) {
  const url = new URL(iamUrl('/oauth/logout'))
  if (idToken) url.searchParams.set('id_token_hint', idToken)
  else url.searchParams.set('client_id', env.get('IAM_CLIENT_ID'))
  url.searchParams.set('post_logout_redirect_uri', postLogoutUri())
  return url.toString()
}
