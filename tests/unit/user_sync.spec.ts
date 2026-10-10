import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import AppUser from '#models/app_user'
import Client from '#models/client'
import { syncAppUser } from '#services/user_sync'

/**
 * Runs inside a transaction on the direct connection that is rolled back afterwards.
 */
test.group('user sync', (group) => {
  let trx: Awaited<ReturnType<typeof db.transaction>>

  group.each.setup(async () => {
    trx = await db.connection('postgres_direct').transaction()
    return () => trx.rollback()
  })

  test('creates a mirror for a new IAM user', async ({ assert }) => {
    const sub = randomUUID()
    const user = await syncAppUser({ sub, email: 'new@example.com' }, 'employee', trx)
    assert.equal(user?.id, sub)
  })

  test('re-keys a live row whose email matches a new IAM id and keeps its content', async ({
    assert,
  }) => {
    const oldId = randomUUID()
    const newId = randomUUID()
    await AppUser.create({ id: oldId, email: 'Staff@Example.com', role: 'employee' }, { client: trx })
    const client = await Client.create({ name: 'Acme', createdBy: oldId }, { client: trx })

    const user = await syncAppUser({ sub: newId, email: 'staff@example.com' }, 'admin', trx)

    assert.equal(user?.id, newId)
    assert.equal(user?.role, 'admin')
    const rows = await AppUser.query({ client: trx }).where('email', 'staff@example.com')
    assert.lengthOf(rows, 1)
    await client.refresh()
    assert.equal(client.createdBy, newId)
  })

  test('returns null for a soft-deleted account', async ({ assert }) => {
    const sub = randomUUID()
    await trx.rawQuery(
      `INSERT INTO app_user (id, email, role, deleted_at) VALUES (?, 'gone@example.com', 'employee', now())`,
      [sub]
    )
    assert.isNull(await syncAppUser({ sub, email: 'gone@example.com' }, 'employee', trx))
  })
})
