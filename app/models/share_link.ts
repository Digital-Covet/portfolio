import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import ShareView from '#models/share_view'

/**
 * Supabase `share_links` table.
 */
export default class ShareLink extends BaseModel {
  static connection = 'postgres'
  static table = 'share_links'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare token: string

  @column()
  declare name: string

  @column({ columnName: 'recipient_name' })
  declare recipientName: string | null

  @column({ columnName: 'recipient_email' })
  declare recipientEmail: string | null

  @column({ columnName: 'password_hash' })
  declare passwordHash: string | null

  @column({ columnName: 'expires_at' })
  declare expiresAt: DateTime | null

  @column({ columnName: 'max_views' })
  declare maxViews: number | null

  @column({ columnName: 'view_count' })
  declare viewCount: number

  @column()
  declare revoked: boolean

  @column({ columnName: 'specific_case_study_ids' })
  declare specificCaseStudyIds: string[] | null

  @column({ columnName: 'filter_sector_ids' })
  declare filterSectorIds: string[] | null

  @column({ columnName: 'filter_industry_ids' })
  declare filterIndustryIds: string[] | null

  @column({ columnName: 'filter_key_business_ids' })
  declare filterKeyBusinessIds: string[] | null

  @column({ columnName: 'filter_category_ids' })
  declare filterCategoryIds: string[] | null

  @column({ columnName: 'filter_service_ids' })
  declare filterServiceIds: string[] | null

  @column({ columnName: 'filter_client_ids' })
  declare filterClientIds: string[] | null

  @column({ columnName: 'created_by' })
  declare createdBy: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @hasMany(() => ShareView, { foreignKey: 'shareLinkId' })
  declare views: HasMany<typeof ShareView>
}
