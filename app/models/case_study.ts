import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Client from '#models/client'
import CaseStudyMetric from '#models/case_study_metric'

export type CaseStudyStatus = 'draft' | 'published' | 'archived'

/**
 * Supabase `case_studies` table.
 */
export default class CaseStudy extends BaseModel {
  static connection = 'postgres'
  static table = 'case_studies'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare slug: string

  @column()
  declare status: CaseStudyStatus

  @column({ columnName: 'description' })
  declare description: string | null

  @column({ columnName: 'challenge' })
  declare challenge: string | null

  @column({ columnName: 'solution' })
  declare solution: string | null

  @column({ columnName: 'results' })
  declare results: string | null

  @column({ columnName: 'hero_image_url' })
  declare heroImageUrl: string | null

  @column({ columnName: 'gallery_urls' })
  declare galleryUrls: string[] | null

  @column({ columnName: 'video_embed_url' })
  declare videoEmbedUrl: string | null

  @column({ columnName: 'attachment_urls' })
  declare attachmentUrls: unknown | null

  @column({ columnName: 'testimonial_quote' })
  declare testimonialQuote: string | null

  @column({ columnName: 'testimonial_author' })
  declare testimonialAuthor: string | null

  @column({ columnName: 'testimonial_title' })
  declare testimonialTitle: string | null

  @column({ columnName: 'client_id' })
  declare clientId: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column.dateTime({ columnName: 'project_date' })
  declare projectDate: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Client, { foreignKey: 'clientId' })
  declare client: BelongsTo<typeof Client>

  @hasMany(() => CaseStudyMetric, { foreignKey: 'caseStudyId' })
  declare metrics: HasMany<typeof CaseStudyMetric>
}
