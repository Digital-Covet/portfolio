export type ShareState = 'active' | 'expiring' | 'expired' | 'limit'

export type RuleField =
  'sector' | 'industry' | 'keyBusiness' | 'workCategory' | 'service' | 'client'

/** Full recipient URL for a share token. The portal lives at `/s/:token`. */
export function shareUrl(token: string) {
  return `${location.origin}/s/${token}`
}

/** "s/7F3K…": enough of the token to quote on a call without printing the whole secret. */
export function shortToken(token: string) {
  return `s/${token.slice(0, 4)}…`
}

const rtf = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' })

export function relativeTime(iso: string) {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

/**
 * A password typed in the builder, held in memory just long enough for the "Link ready"
 * dialog on the next page. It is never stored, put in a URL, or sent back from the server.
 */
let pendingPassword: string | null = null
export const passwordHandoff = {
  set: (value: string | null) => {
    pendingPassword = value
  },
  take: () => {
    const value = pendingPassword
    pendingPassword = null
    return value
  },
}

const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** 14 characters from an unambiguous alphabet, drawn from the browser CSPRNG. */
export function generatePassword() {
  const bytes = crypto.getRandomValues(new Uint32Array(14))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
