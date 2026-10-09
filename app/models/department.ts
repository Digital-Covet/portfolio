import { DepartmentSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import AppUser from '#models/app_user'
import CaseStudy from '#models/case_study'

export default class Department extends DepartmentSchema {
  static table = 'department'

  @hasMany(() => AppUser)
  declare users: HasMany<typeof AppUser>

  @hasMany(() => CaseStudy)
  declare caseStudies: HasMany<typeof CaseStudy>
}
