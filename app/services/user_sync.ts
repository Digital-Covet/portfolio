import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import AppUser from '#models/app_user'

export type IamProfile = {
  sub: string
  email: string
  name?: string | null
  picture?: string | null
}

/**
 * Mirrors an IAM profile into `app_user`. Returns null when the account is soft-deleted.
 *
 * A live row with the same email but another id means IAM re-issued the user id; that row
 * is re-keyed (FKs cascade) so the person keeps their authorship instead of colliding on
 * `app_user_email_live_uq`.
 */
export async function syncAppUser(
  profile: IamProfile,
  role: AppUser['role'],
  client?: TransactionClientContract
): Promise<AppUser | null> {
  if (!client) return db.transaction((trx) => syncAppUser(profile, role, trx))

  let user = await AppUser.find(profile.sub, { client })
  if (user?.deletedAt) return null

  if (!user) {
    const stale = await AppUser.query({ client })
      .where('email', profile.email)
      .whereNull('deleted_at')
      .first()
    if (stale) {
      logger.info({ from: stale.id, to: profile.sub }, 'Re-keying app_user to new IAM id')
      await client.from('app_user').where('id', stale.id).update({ id: profile.sub })
      user = await AppUser.findOrFail(profile.sub, { client })
    } else {
      user = new AppUser()
      user.id = profile.sub
      user.useTransaction(client)
    }
  }

  user.role = role
  user.email = profile.email
  user.name = profile.name ?? null
  user.image = profile.picture ?? null
  user.lastSyncedAt = DateTime.now()
  await user.save()
  return user
}
