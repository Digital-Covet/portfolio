import { CaseStudySchema } from '#database/schema'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import AppUser from '#models/app_user'
import BusinessModel from '#models/business_model'
import CaseStudyMetric from '#models/case_study_metric'
import CaseStudyTestimonial from '#models/case_study_testimonial'
import CaseStudyVideo from '#models/case_study_video'
import Client from '#models/client'
import Department from '#models/department'
import File from '#models/file'
import KeyBusiness from '#models/key_business'
import Service from '#models/service'
import WorkCategory from '#models/work_category'
import { liveScope } from '#models/helpers/soft_delete'

export default class CaseStudy extends CaseStudySchema {
  static table = 'case_study'

  static live = liveScope

  @belongsTo(() => Client)
  declare client: BelongsTo<typeof Client>

  @belongsTo(() => Department)
  declare department: BelongsTo<typeof Department>

  @belongsTo(() => File, { foreignKey: 'heroFileId' })
  declare hero: BelongsTo<typeof File>

  @belongsTo(() => AppUser, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof AppUser>

  @belongsTo(() => AppUser, { foreignKey: 'updatedBy' })
  declare editor: BelongsTo<typeof AppUser>

  @manyToMany(() => KeyBusiness, { pivotTable: 'case_study_key_business' })
  declare keyBusinesses: ManyToMany<typeof KeyBusiness>

  @manyToMany(() => WorkCategory, { pivotTable: 'case_study_work_category' })
  declare workCategories: ManyToMany<typeof WorkCategory>

  @manyToMany(() => Service, { pivotTable: 'case_study_service' })
  declare services: ManyToMany<typeof Service>

  @manyToMany(() => BusinessModel, { pivotTable: 'case_study_business_model' })
  declare businessModels: ManyToMany<typeof BusinessModel>

  /**
   * Gallery images; `sort_order` lives on the pivot row.
   */
  @manyToMany(() => File, {
    pivotTable: 'case_study_image',
    pivotRelatedForeignKey: 'file_id',
    pivotColumns: ['sort_order'],
    pivotTimestamps: true,
  })
  declare images: ManyToMany<typeof File>

  @manyToMany(() => File, {
    pivotTable: 'case_study_attachment',
    pivotRelatedForeignKey: 'file_id',
    pivotTimestamps: { createdAt: 'created_at', updatedAt: false },
  })
  declare attachments: ManyToMany<typeof File>

  @hasMany(() => CaseStudyVideo)
  declare videos: HasMany<typeof CaseStudyVideo>

  @hasMany(() => CaseStudyMetric)
  declare metrics: HasMany<typeof CaseStudyMetric>

  @hasMany(() => CaseStudyTestimonial)
  declare testimonials: HasMany<typeof CaseStudyTestimonial>
}
