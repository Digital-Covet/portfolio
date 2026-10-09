import { scope } from '@adonisjs/lucid/orm'
import type { LucidModel } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'

/**
 * Query scope that excludes soft-deleted rows: `Model.query().apply((s) => s.live())`.
 */
export const liveScope = scope((query: any) => {
  query.whereNull('deleted_at')
})

/**
 * Marks a row as deleted without removing it.
 */
export async function markDeleted<
  T extends InstanceType<LucidModel> & { deletedAt: DateTime | null },
>(row: T): Promise<T> {
  row.deletedAt = DateTime.now()
  await row.save()
  return row
}

/**
 * Clears the soft-delete marker.
 */
export async function markRestored<
  T extends InstanceType<LucidModel> & { deletedAt: DateTime | null },
>(row: T): Promise<T> {
  row.deletedAt = null
  await row.save()
  return row
}
