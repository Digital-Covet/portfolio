import db from '@adonisjs/lucid/services/db'

/** Wrong guesses allowed per client and share inside one window. */
export const UNLOCK_ATTEMPTS = 5
const WINDOW_MINUTES = 10

/**
 * Postgres-backed limiter for share passwords, so the count is shared by every app
 * process and survives restarts. An attempt is consumed *before* the password is
 * checked, with one atomic upsert, so parallel guesses cannot slip past the limit.
 */
export default class UnlockLimiter {
  /**
   * Consumes one attempt. Returns false when the client is already over the limit, in
   * which case the password must not be checked at all.
   */
  async consume(key: string): Promise<boolean> {
    const { rows } = await db.rawQuery(
      `INSERT INTO share_unlock_attempt AS a (key, attempts, reset_at)
       VALUES (?, 1, now() + (? * interval '1 minute'))
       ON CONFLICT (key) DO UPDATE SET
         attempts = CASE WHEN a.reset_at <= now() THEN 1 ELSE a.attempts + 1 END,
         reset_at = CASE WHEN a.reset_at <= now()
                         THEN now() + (? * interval '1 minute') ELSE a.reset_at END
       RETURNING attempts`,
      [key, WINDOW_MINUTES, WINDOW_MINUTES]
    )
    return rows[0].attempts <= UNLOCK_ATTEMPTS
  }

  /** A correct password clears the client's count. Also sweeps long-expired rows. */
  async clear(key: string) {
    await db.rawQuery(
      "DELETE FROM share_unlock_attempt WHERE key = ? OR reset_at < now() - interval '1 day'",
      [key]
    )
  }
}
