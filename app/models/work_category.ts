import { WorkCategorySchema } from '#database/schema'
import { manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import CaseStudy from '#models/case_study'

export default class WorkCategory extends WorkCategorySchema {
  static table = 'work_category'

  @manyToMany(() => CaseStudy, { pivotTable: 'case_study_work_category' })
  declare caseStudies: ManyToMany<typeof CaseStudy>
}
