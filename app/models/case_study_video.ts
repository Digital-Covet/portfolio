import { CaseStudyVideoSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CaseStudy from '#models/case_study'

export default class CaseStudyVideo extends CaseStudyVideoSchema {
  static table = 'case_study_video'

  @belongsTo(() => CaseStudy)
  declare caseStudy: BelongsTo<typeof CaseStudy>
}
