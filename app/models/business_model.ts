import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Supabase `business_models` table: id (text), name, created_at.
 */
export default class BusinessModel extends BaseModel {
  static connection = 'postgres'
  static table = 'business_models'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
