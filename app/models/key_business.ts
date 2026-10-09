import { KeyBusinessSchema } from '#database/schema'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Industry from '#models/industry'
import Client from '#models/client'
import CaseStudy from '#models/case_study'

export default class KeyBusiness extends KeyBusinessSchema {
  static table = 'key_business'

  @belongsTo(() => Industry)
  declare industry: BelongsTo<typeof Industry>

  @manyToMany(() => Client, { pivotTable: 'client_key_business' })
  declare clients: ManyToMany<typeof Client>

  @manyToMany(() => CaseStudy, { pivotTable: 'case_study_key_business' })
  declare caseStudies: ManyToMany<typeof CaseStudy>
}
