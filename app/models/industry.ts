import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Sector from '#models/sector'
import KeyBusiness from '#models/key_business'

/**
 * Supabase `industries` table: id (text), name, sector_id (nullable), created_at.
 */
export default class Industry extends BaseModel {
  static connection = 'postgres'
  static table = 'industries'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'sector_id' })
  declare sectorId: string | null

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @belongsTo(() => Sector, { foreignKey: 'sectorId' })
  declare sector: BelongsTo<typeof Sector>

  @hasMany(() => KeyBusiness, { foreignKey: 'industryId' })
  declare keyBusinesses: HasMany<typeof KeyBusiness>
}
