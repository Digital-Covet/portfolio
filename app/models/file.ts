import { FileSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import AppUser from '#models/app_user'

/**
 * Metadata for an object stored in Supabase Object Storage (`bucket` + `storagePath`).
 */
export default class File extends FileSchema {
  static table = 'file'

  @belongsTo(() => AppUser, { foreignKey: 'uploadedBy' })
  declare uploader: BelongsTo<typeof AppUser>
}
