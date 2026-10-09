import { IndustrySchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Sector from '#models/sector'
import KeyBusiness from '#models/key_business'

export default class Industry extends IndustrySchema {
  static table = 'industry'

  @belongsTo(() => Sector)
  declare sector: BelongsTo<typeof Sector>

  @hasMany(() => KeyBusiness)
  declare keyBusinesses: HasMany<typeof KeyBusiness>
}
