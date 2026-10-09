import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Client from '#models/client'
import { CLIENTS } from './data/clients.js'
import { ensureStaff } from './data/staff.js'

/**
 * Idempotent: clients are matched by name. Existing rows (for example ones created as a
 * side effect of the case study seeder) get the creator and timestamps from the backup.
 */
export default class extends BaseSeeder {
  async run() {
    const { users } = await ensureStaff()

    for (const seed of CLIENTS) {
      const createdBy = users[seed.creator].id
      const createdAt = DateTime.fromISO(seed.createdAt)
      const existing = await Client.query().where('name', seed.name).whereNull('deleted_at').first()

      if (!existing) {
        await Client.create({ name: seed.name, createdBy, createdAt, updatedAt: createdAt })
        continue
      }

      const inSync = existing.createdBy === createdBy && existing.createdAt.equals(createdAt)
      if (inSync) continue

      // The set_updated_at trigger would stamp "now" on any UPDATE, so pause it to keep
      // updated_at equal to created_at as in the backup.
      await db.transaction(async (trx) => {
        await trx.rawQuery('ALTER TABLE client DISABLE TRIGGER client_set_updated_at')
        await trx.from('client').where('id', existing.id).update({
          created_by: createdBy,
          created_at: createdAt.toSQL(),
          updated_at: createdAt.toSQL(),
        })
        await trx.rawQuery('ALTER TABLE client ENABLE TRIGGER client_set_updated_at')
      })
    }
  }
}
