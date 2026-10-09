import { ShareSchema } from '#database/schema'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import AppUser from '#models/app_user'
import CaseStudy from '#models/case_study'
import Client from '#models/client'
import Industry from '#models/industry'
import KeyBusiness from '#models/key_business'
import Sector from '#models/sector'
import Service from '#models/service'
import ShareView from '#models/share_view'
import WorkCategory from '#models/work_category'
import { liveScope } from '#models/helpers/soft_delete'

/**
 * A tokenised portfolio link. Targeting is the explicit case study list plus the filter
 * relations below; how they combine is application logic.
 */
export default class Share extends ShareSchema {
  static table = 'share'

  static live = liveScope

  @belongsTo(() => AppUser, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof AppUser>

  @belongsTo(() => AppUser, { foreignKey: 'updatedBy' })
  declare editor: BelongsTo<typeof AppUser>

  @manyToMany(() => CaseStudy, { pivotTable: 'share_case_study' })
  declare caseStudies: ManyToMany<typeof CaseStudy>

  @manyToMany(() => Sector, { pivotTable: 'share_sector' })
  declare sectors: ManyToMany<typeof Sector>

  @manyToMany(() => Industry, { pivotTable: 'share_industry' })
  declare industries: ManyToMany<typeof Industry>

  @manyToMany(() => KeyBusiness, { pivotTable: 'share_key_business' })
  declare keyBusinesses: ManyToMany<typeof KeyBusiness>

  @manyToMany(() => WorkCategory, { pivotTable: 'share_work_category' })
  declare workCategories: ManyToMany<typeof WorkCategory>

  @manyToMany(() => Service, { pivotTable: 'share_service' })
  declare services: ManyToMany<typeof Service>

  @manyToMany(() => Client, { pivotTable: 'share_client' })
  declare clients: ManyToMany<typeof Client>

  @hasMany(() => ShareView)
  declare views: HasMany<typeof ShareView>
}
