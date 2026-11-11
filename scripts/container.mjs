#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { APP_ROOT, loadEnvFile } from './lib/env.mjs'

const IMAGE = process.env.IMAGE || 'ghcr.io/digitalcovet/portfolio-digital-covet:local'
const CONTAINER = process.env.CONTAINER_NAME || 'portfolio-digital-covet'
const HOST_PORT = process.env.HOST_PORT || '3333'

const USAGE = `Usage: node scripts/container.mjs <command>

Commands:
  build    Build the production image (IMAGE=${IMAGE})
  push     Push the image to its registry
  run      Start the container locally with the values from .env
  stop     Remove the local container
  logs     Follow the container logs
  health   Run the image healthcheck once
  shell    Open a shell inside the running container

Environment:
  IMAGE           Image reference to build/push/run (default: ${IMAGE})
  CONTAINER_NAME  Container name (default: ${CONTAINER})
  HOST_PORT       Host port to publish (default: ${HOST_PORT})
  APP_URL         Public URL passed to the app (default: http://localhost:${HOST_PORT})
`

function podman(args, env = process.env) {
  const result = spawnSync('podman', args, {
    cwd: APP_ROOT,
    env,
    stdio: 'inherit',
  })

  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

/**
 * Build the environment for a local container. Values come from `.env`, with
 * the production overrides the image expects. `APP_URL` intentionally does not
 * come from `.env`: that is the deployed public URL, while a local run is
 * reached on localhost. Pass APP_URL explicitly to override it.
 */
function runtimeEnv() {
  const fileEnv = loadEnvFile()
  return {
    ...fileEnv,
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    PORT: '3333',
    TZ: fileEnv.TZ || 'UTC',
    APP_URL: process.env.APP_URL || `http://localhost:${HOST_PORT}`,
  }
}

function build() {
  // The image build does not need runtime secrets, so a missing `.env` (CI,
  // a clean server checkout) is fine: only the public VITE_* values are baked
  // in, and they can come from the process environment instead.
  let env = {}
  try {
    env = loadEnvFile()
  } catch {
    env = {}
  }

  const appName =
    process.env.VITE_APP_NAME || env.VITE_APP_NAME || env.APP_NAME || 'Portfolio - Digital Covet'
  const accountUrl = process.env.VITE_IAM_ACCOUNT_URL || env.VITE_IAM_ACCOUNT_URL || ''

  // Podman defaults to the OCI image format, which drops HEALTHCHECK. The
  // Docker format is still a normal OCI-runnable image and keeps it.
  podman([
    'build',
    '--format',
    'docker',
    '--build-arg',
    `VITE_APP_NAME=${appName}`,
    '--build-arg',
    `VITE_IAM_ACCOUNT_URL=${accountUrl}`,
    '--tag',
    IMAGE,
    '.',
  ])
}

function push() {
  podman(['push', IMAGE])
}

function run() {
  const env = runtimeEnv()
  const envArgs = Object.entries(env)
    .filter(([, value]) => value !== '')
    .flatMap(([key]) => ['--env', key])

  podman(
    [
      'run',
      '--detach',
      '--replace',
      '--name',
      CONTAINER,
      '--publish',
      `${HOST_PORT}:3333`,
      // Mirrors the hardened Kubernetes security context.
      '--read-only',
      '--tmpfs',
      '/app/tmp:mode=1777',
      '--tmpfs',
      '/tmp:mode=1777',
      '--security-opt',
      'no-new-privileges',
      '--stop-timeout',
      '30',
      ...envArgs,
      IMAGE,
    ],
    { ...process.env, ...env }
  )

  console.log(`\nContainer ${CONTAINER} started on ${env.APP_URL}`)
  console.log(`Health:  node scripts/container.mjs health`)
  console.log(`Logs:    node scripts/container.mjs logs`)
}

function stop() {
  podman(['rm', '--force', '--ignore', CONTAINER])
}

function logs() {
  podman(['logs', '--follow', CONTAINER])
}

function health() {
  podman(['healthcheck', 'run', CONTAINER])
}

function shell() {
  podman(['exec', '--interactive', '--tty', CONTAINER, 'sh'])
}

const [command = 'help'] = process.argv.slice(2)

switch (command) {
  case 'build':
    build()
    break
  case 'push':
    push()
    break
  case 'run':
    run()
    break
  case 'stop':
    stop()
    break
  case 'logs':
    logs()
    break
  case 'health':
    health()
    break
  case 'shell':
    shell()
    break
  case 'help':
  case '--help':
  case '-h':
    process.stdout.write(USAGE)
    break
  default:
    console.error(`Unknown command: ${command}\n`)
    process.stderr.write(USAGE)
    process.exit(1)
}
