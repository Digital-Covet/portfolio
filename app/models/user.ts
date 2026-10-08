import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static connection = 'sqlite'
  get appAccessList(): string[] {
    try {
      const raw = (this as unknown as Record<string, unknown>).appAccess
      if (Array.isArray(raw)) return raw as string[]
      if (typeof raw === 'string' && raw.length > 0) return JSON.parse(raw) as string[]
    } catch {
      // fall through
    }
    return []
  }

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }
}
