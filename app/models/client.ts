import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Supabase `clients` table.
 */
export default class Client extends BaseModel {
  static connection = 'postgres'
  static table = 'clients'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column({ columnName: 'logo_url' })
  declare logoUrl: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime
}
