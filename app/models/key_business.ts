import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Industry from '#models/industry'

/**
 * Supabase `key_businesses` table: id (text), name, industry_id (nullable), created_at.
 */
export default class KeyBusiness extends BaseModel {
  static connection = 'postgres'
  static table = 'key_businesses'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'industry_id' })
  declare industryId: string | null

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @belongsTo(() => Industry, { foreignKey: 'industryId' })
  declare industry: BelongsTo<typeof Industry>
}
