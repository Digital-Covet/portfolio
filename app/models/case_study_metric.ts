import { CaseStudyMetricSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CaseStudy from '#models/case_study'

export default class CaseStudyMetric extends CaseStudyMetricSchema {
  static table = 'case_study_metric'

  @belongsTo(() => CaseStudy)
  declare caseStudy: BelongsTo<typeof CaseStudy>
}
