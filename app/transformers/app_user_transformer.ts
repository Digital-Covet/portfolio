import type AppUser from '#models/app_user'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class AppUserTransformer extends BaseTransformer<AppUser> {
  toObject() {
    return this.pick(this.resource, [
      'id',
      'name',
      'email',
      'image',
      'role',
      'departmentId',
      'createdAt',
      'updatedAt',
      'initials',
    ])
  }
}
