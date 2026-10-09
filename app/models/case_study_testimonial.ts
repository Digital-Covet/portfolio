import { CaseStudyTestimonialSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CaseStudy from '#models/case_study'

export default class CaseStudyTestimonial extends CaseStudyTestimonialSchema {
  static table = 'case_study_testimonial'

  @belongsTo(() => CaseStudy)
  declare caseStudy: BelongsTo<typeof CaseStudy>
}
