import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Deletes uploads that nothing references: files the editor uploaded but that were never
 * saved on a case study (or were replaced/removed before saving). Soft-deleted case
 * studies still hold their files, so only truly unreferenced rows are touched.
 *
 * Dry run by default; pass --force to delete.
 */
export default class FilesPrune extends BaseCommand {
  static commandName = 'files:prune'
  static description = 'Remove uploaded files that no case study or client references'
  static options: CommandOptions = { startApp: true }

  @flags.number({ description: 'Only files older than this many hours (default 24)' })
  declare hours?: number

  @flags.boolean({ description: 'Actually delete (default is a dry run)' })
  declare force?: boolean

  async run() {
    const db = (await this.app.container.make(
      'lucid.db'
    )) as typeof import('@adonisjs/lucid/services/db').default
    const { default: StorageService } = await import('#services/storage_service')

    // 0 is valid ("everything unreferenced, right now"), so only fall back when unset.
    const hours = this.hours !== undefined && this.hours >= 0 ? this.hours : 24
    const { rows } = await db.rawQuery(
      `SELECT f.id, f.bucket, f.storage_path, f.original_name
       FROM file f
       WHERE f.created_at < now() - (? * interval '1 hour')
         AND NOT EXISTS (SELECT 1 FROM case_study c WHERE c.hero_file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM case_study_image i WHERE i.file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM case_study_attachment a WHERE a.file_id = f.id)
         AND NOT EXISTS (SELECT 1 FROM client cl WHERE cl.logo_file_id = f.id)
       ORDER BY f.created_at`,
      [hours]
    )

    if (rows.length === 0) {
      const total = await db.from('file').count('* as n').first()
      this.logger.success(`No orphaned files (${total?.n ?? 0} file rows in total).`)
      return
    }

    this.logger.info(`${rows.length} orphaned file(s) older than ${hours}h`)
    if (!this.force) {
      for (const r of rows) this.logger.log(`  ${r.bucket}/${r.storage_path}  (${r.original_name})`)
      this.logger.warning('Dry run. Re-run with --force to delete.')
      return
    }

    const storage = new StorageService()
    for (const r of rows) {
      // Storage removal is best effort; the row goes either way so it is not retried forever.
      await storage.remove(r.bucket, r.storage_path)
      await db.from('file').where('id', r.id).delete()
    }
    this.logger.success(`Deleted ${rows.length} file(s).`)
  }
}
