import { BusinessModelSchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import CaseStudy from '#models/case_study'

export default class BusinessModel extends BusinessModelSchema {
  static table = 'business_model'

  @manyToMany(() => CaseStudy, { pivotTable: 'case_study_business_model' })
  declare caseStudies: ManyToMany<typeof CaseStudy>
}
