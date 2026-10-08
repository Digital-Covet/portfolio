import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Supabase `share_views` table.
 */
export default class ShareView extends BaseModel {
  static connection = 'postgres'
  static table = 'share_views'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'share_link_id' })
  declare shareLinkId: string

  @column()
  declare ip: string | null

  @column({ columnName: 'session_id' })
  declare sessionId: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true, columnName: 'viewed_at' })
  declare viewedAt: DateTime
}
