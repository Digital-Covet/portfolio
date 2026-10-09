import { ShareViewSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Share from '#models/share'

export default class ShareView extends ShareViewSchema {
  static table = 'share_view'

  @belongsTo(() => Share)
  declare share: BelongsTo<typeof Share>
}
