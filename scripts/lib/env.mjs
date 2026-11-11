import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'

export const APP_ROOT = resolve(import.meta.dirname, '..', '..')

/**
 * Keys that are owned by the Kubernetes ConfigMap (or are build-time only).
 * Everything else found in `.env` is deployment-specific and goes into the
 * `portfolio-env` Secret.
 */
export const CONFIG_KEYS = new Set([
  'APP_NAME',
  'APP_URL',
  'HOST',
  'PORT',
  'NODE_ENV',
  'TZ',
  'LOG_LEVEL',
  'SESSION_DRIVER',
  'VITE_APP_NAME',
  'VITE_IAM_ACCOUNT_URL',
])

/** Variables the application refuses to boot without. */
export const REQUIRED_KEYS = [
  'APP_KEY',
  'DATABASE_URL',
  'DIRECT_URL',
  'IAM_URL',
  'IAM_CLIENT_ID',
  'IAM_CLIENT_SECRET',
]

/**
 * Parse a dotenv file without touching the current process environment.
 *
 * `--env-file` (Podman and `kubectl create secret`) keeps the quotes around
 * quoted values, which corrupts every value in this project's `.env`. Node's
 * parser strips them the same way the AdonisJS env loader does.
 */
export function loadEnvFile(file = resolve(APP_ROOT, '.env')) {
  if (!existsSync(file)) {
    throw new Error(`Missing environment file: ${file}`)
  }

  return { ...parseEnv(readFileSync(file, 'utf8')) }
}
