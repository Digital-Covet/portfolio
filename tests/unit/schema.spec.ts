import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import AppUser from '#models/app_user'
import CaseStudy from '#models/case_study'
import Client from '#models/client'
import Department from '#models/department'
import KeyBusiness from '#models/key_business'
import Industry from '#models/industry'
import Sector from '#models/sector'
import Share from '#models/share'
import { markDeleted } from '#models/helpers/soft_delete'

/**
 * Exercises the Supabase schema through the models. Every test runs inside a transaction
 * on the direct connection and is rolled back, so nothing is persisted.
 */
test.group('schema', (group) => {
  let trx: Awaited<ReturnType<typeof db.transaction>>

  group.each.setup(async () => {
    trx = await db.connection('postgres_direct').transaction()
    return () => trx.rollback()
  })

  async function seed() {
    const department = await Department.create({ name: 'Design' }, { client: trx })
    const user = await AppUser.create(
      { id: randomUUID(), email: 'Staff@Example.com', role: 'admin', departmentId: department.id },
      { client: trx }
    )
    const client = await Client.create({ name: 'Acme', createdBy: user.id }, { client: trx })
    return { department, user, client }
  }

  test('app_user keeps the supplied IAM id and email is case-insensitive', async ({ assert }) => {
    const { user } = await seed()
    assert.match(user.id, /^[0-9a-f-]{36}$/)
    const found = await AppUser.query({ client: trx }).where('email', 'staff@example.com').first()
    assert.equal(found?.id, user.id)
  })

  test('check constraints reject invalid values', async ({ assert }) => {
    const { department } = await seed()
    await trx.rawQuery('SAVEPOINT s1')
    await assert.rejects(
      () =>
        AppUser.create(
          { id: randomUUID(), email: 'x@y.com', role: 'owner' as any },
          { client: trx }
        ),
      /app_user_role_check/
    )
    await trx.rawQuery('ROLLBACK TO SAVEPOINT s1')
    assert.exists(department.id)
  })

  test('case study relations, tags and live scope work', async ({ assert }) => {
    const { department, user, client } = await seed()
    const sector = await Sector.create({ name: 'Finance' }, { client: trx })
    const industry = await Industry.create(
      { name: 'Banking', sectorId: sector.id },
      { client: trx }
    )
    const kb = await KeyBusiness.create(
      { name: 'Retail', industryId: industry.id },
      { client: trx }
    )

    const study = await CaseStudy.create(
      {
        title: 'Rebrand',
        slug: 'rebrand',
        status: 'published',
        clientId: client.id,
        departmentId: department.id,
        createdBy: user.id,
      },
      { client: trx }
    )
    await study.related('keyBusinesses').attach([kb.id])

    const loaded = await CaseStudy.query({ client: trx })
      .where('id', study.id)
      .preload('client')
      .preload('keyBusinesses')
      .firstOrFail()
    assert.equal(loaded.client.name, 'Acme')
    assert.lengthOf(loaded.keyBusinesses, 1)

    await markDeleted(study)
    const live = await CaseStudy.query({ client: trx })
      .where('id', study.id)
      .apply((s) => s.live())
    assert.lengthOf(live, 0)
  })

  test('updated_at trigger fires and share token is unique', async ({ assert }) => {
    const { user } = await seed()
    const share = await Share.create(
      { name: 'Pitch', token: 'tok_1', createdBy: user.id },
      { client: trx }
    )

    // Force a stale value, then let the trigger overwrite it. Inside a transaction
    // CURRENT_TIMESTAMP is the transaction start, which is what now() returns.
    await trx.rawQuery("update share set updated_at = '2000-01-01' where id = ?", [share.id])
    await trx.rawQuery('update share set name = ? where id = ?', ['Pitch 2', share.id])
    const { rows } = await trx.rawQuery(
      'select updated_at = now() as touched from share where id = ?',
      [share.id]
    )
    assert.isTrue(rows[0].touched)

    await trx.rawQuery('SAVEPOINT s2')
    await assert.rejects(
      () => Share.create({ name: 'Dup', token: 'tok_1', createdBy: user.id }, { client: trx }),
      /share_token_uq/
    )
    await trx.rawQuery('ROLLBACK TO SAVEPOINT s2')
  })
})
