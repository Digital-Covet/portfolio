#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { APP_ROOT, CONFIG_KEYS, REQUIRED_KEYS, loadEnvFile } from './lib/env.mjs'

const args = process.argv.slice(2)
const namespaceArg = args.indexOf('--namespace')
const NAMESPACE =
  namespaceArg !== -1 ? args[namespaceArg + 1] : process.env.K8S_NAMESPACE || 'portfolio'
const SECRET_NAME = process.env.SECRET_NAME || 'portfolio-env'
const PRINT_ONLY = args.includes('--print')

function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}

const env = loadEnvFile()
const missing = REQUIRED_KEYS.filter((key) => !env[key])
if (missing.length > 0) {
  fail(`missing required variables in .env: ${missing.join(', ')}`)
}

/**
 * Everything deployment-specific lives in the Secret, except the variables the
 * ConfigMap owns (static runtime config) and build-time values. Empty optional
 * values are omitted so they behave as truly unset.
 */
const entries = Object.entries(env).filter(([key, value]) => !CONFIG_KEYS.has(key) && value !== '')

if (entries.length === 0) {
  fail('no deployment values found in .env')
}

const invalidKey = entries.find(([key]) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
if (invalidKey) {
  fail(`invalid environment variable name: ${invalidKey[0]}`)
}

/**
 * Build the Secret here instead of using `kubectl create secret --from-literal`,
 * which would expose every value in the process list. Base64 also sidesteps
 * YAML quoting for values that contain `:`, `#`, or quotes.
 */
const data = entries
  .map(([key, value]) => `  ${key}: ${Buffer.from(value).toString('base64')}`)
  .join('\n')

const manifest = `apiVersion: v1
kind: Secret
metadata:
  name: ${SECRET_NAME}
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: portfolio
    app.kubernetes.io/part-of: digital-covet
type: Opaque
data:
${data}
`

if (PRINT_ONLY) {
  process.stdout.write(manifest)
  process.exit(0)
}

const apply = spawnSync('kubectl', ['apply', '--filename', '-'], {
  cwd: APP_ROOT,
  input: manifest,
  stdio: ['pipe', 'inherit', 'inherit'],
})

if (apply.error) fail(apply.error.message)
if (apply.status !== 0) process.exit(apply.status ?? 1)

console.log(`Secret ${NAMESPACE}/${SECRET_NAME} updated (${entries.length} keys)`)
