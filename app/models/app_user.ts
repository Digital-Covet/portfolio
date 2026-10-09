import { AppUserSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Department from '#models/department'
import { liveScope } from '#models/helpers/soft_delete'

/**
 * Local mirror of an IAM user. `id` is the IAM user id and is never generated here.
 */
export default class AppUser extends AppUserSchema {
  static table = 'app_user'

  /**
   * The id comes from IAM, so Lucid must not try to read it back from the insert.
   */
  static selfAssignPrimaryKey = true

  static live = liveScope

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  get initials() {
    const source = this.name?.trim() || this.email.split('@')[0]
    const [first, last] = source.split(' ')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return first.slice(0, 2).toUpperCase()
  }
}
