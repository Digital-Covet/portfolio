import { ServiceSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import CaseStudy from '#models/case_study'

export default class Service extends ServiceSchema {
  static table = 'service'

  @manyToMany(() => CaseStudy, { pivotTable: 'case_study_service' })
  declare caseStudies: ManyToMany<typeof CaseStudy>
}
