import { SectorSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Industry from '#models/industry'

export default class Sector extends SectorSchema {
  static table = 'sector'

  @hasMany(() => Industry)
  declare industries: HasMany<typeof Industry>
}
