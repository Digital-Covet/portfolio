import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Supabase `services` table: id (text), name, created_at.
 */
export default class ServiceItem extends BaseModel {
  static connection = 'postgres'
  static table = 'services'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime
}
