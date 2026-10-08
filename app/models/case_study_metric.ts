import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Supabase `case_study_metrics` table.
 */
export default class CaseStudyMetric extends BaseModel {
  static connection = 'postgres'
  static table = 'case_study_metrics'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'case_study_id' })
  declare caseStudyId: string

  @column()
  declare label: string

  @column()
  declare value: string

  @column()
  declare unit: string | null

  @column({ columnName: 'sort_order' })
  declare sortOrder: number
}
