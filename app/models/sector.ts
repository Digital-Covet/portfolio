import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Industry from '#models/industry'

/**
 * Supabase `sectors` table: id (text), name, created_at.
 * No slug / updated_at columns in the live database.
 */
export default class Sector extends BaseModel {
  static connection = 'postgres'
  static table = 'sectors'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @hasMany(() => Industry, { foreignKey: 'sectorId' })
  declare industries: HasMany<typeof Industry>
}
