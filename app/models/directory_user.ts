import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

/**
 * Read-only view of the Supabase `user` (Better Auth) table for owner names.
 * Auth sessions keep using the local sqlite `User` model — do not use this
 * model for login.
 */
export default class DirectoryUser extends BaseModel {
  static connection = 'postgres'
  static table = 'user'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare role: string

  @column({ columnName: 'departmentId' })
  declare departmentId: string | null

  @column.dateTime({ autoCreate: true, columnName: 'createdAt' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updatedAt' })
  declare updatedAt: DateTime
}
