import { randomBytes, createHash } from 'node:crypto'
import env from '#start/env'

function base64Url(buffer: Buffer) {
  return buffer.toString('base64url')
}

export function createPkcePair() {
  const verifier = base64Url(randomBytes(32))
  const challenge = base64Url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export function createState() {
  return base64Url(randomBytes(16))
}

export function getIamConfig() {
  return {
    baseUrl: env.get('IAM_BASE_URL').replace(/\/$/, ''),
    clientId: env.get('OAUTH_CLIENT_ID'),
    clientSecret: env.get('OAUTH_CLIENT_SECRET'),
    redirectUri: env.get('OAUTH_REDIRECT_URI'),
    scopes: env.get('OAUTH_SCOPES'),
  }
}

export function buildAuthorizeUrl(state: string, codeChallenge: string) {
  const { baseUrl, clientId, redirectUri, scopes } = getIamConfig()
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${baseUrl}/api/auth/oauth2/authorize?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const { baseUrl, clientId, clientSecret, redirectUri } = getIamConfig()
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code_verifier: codeVerifier,
  })
  const response = await fetch(`${baseUrl}/api/auth/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`IAM token exchange failed (${response.status}): ${text}`)
  }
  return (await response.json()) as {
    access_token: string
    refresh_token?: string
    id_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
  }
}

export interface IamUserInfo {
  sub: string
  email: string
  name?: string | null
  picture?: string | null
  email_verified?: boolean
  role?: string
  app_access?: string[]
  department_id?: string | null
}

export async function fetchUserInfo(accessToken: string): Promise<IamUserInfo> {
  const { baseUrl } = getIamConfig()
  const response = await fetch(`${baseUrl}/api/auth/oauth2/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`IAM userinfo failed (${response.status}): ${text}`)
  }
  return (await response.json()) as IamUserInfo
}

// Single source of truth for identity roles lives in
// `#services/portfolio_auth` (fail-closed, no `employee` fallback).
// Re-exported here so OAuth call sites import from one place.
export {
  IDENTITY_ROLES,
  isIdentityRole,
  toIdentityRoleStrict,
  type IdentityRole,
} from '#services/portfolio_auth'

function appAccessList(userinfo: IamUserInfo): string[] {
  return Array.isArray(userinfo.app_access) ? userinfo.app_access : []
}

export function hasPortfolioAccess(userinfo: IamUserInfo): boolean {
  // IAM expands admin/superadmin to ALL_APPS in `app_access`, so the
  // claim alone is sufficient. Do NOT bypass on `role` — a forged or
  // stale role must never grant access without the Portfolio claim.
  // Verified against IAM `effectiveAppAccess()` (iam-digitalcovet
  // src/lib/app-access.ts): elevated roles receive
  // ["Share","Portfolio","Desk"], so this fail-closed check does not
  // lock out admins as long as that expansion stays in place.
  return appAccessList(userinfo).includes('Portfolio')
}
