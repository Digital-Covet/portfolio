import { ClientSchema } from '#database/schema'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import AppUser from '#models/app_user'
import CaseStudy from '#models/case_study'
import File from '#models/file'
import KeyBusiness from '#models/key_business'
import { liveScope } from '#models/helpers/soft_delete'

export default class Client extends ClientSchema {
  static table = 'client'

  static live = liveScope

  @belongsTo(() => File, { foreignKey: 'logoFileId' })
  declare logo: BelongsTo<typeof File>

  @belongsTo(() => AppUser, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof AppUser>

  @belongsTo(() => AppUser, { foreignKey: 'updatedBy' })
  declare editor: BelongsTo<typeof AppUser>

  @manyToMany(() => KeyBusiness, { pivotTable: 'client_key_business' })
  declare keyBusinesses: ManyToMany<typeof KeyBusiness>

  @hasMany(() => CaseStudy)
  declare caseStudies: HasMany<typeof CaseStudy>
}
