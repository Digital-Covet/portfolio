# Portfolio — Digital Covet

[![Node](https://img.shields.io/badge/node-%E2%89%A526.0.0-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A512.0.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![AdonisJS](https://img.shields.io/badge/AdonisJS-7-5A45FF?logo=adonisjs&logoColor=white)](https://adonisjs.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-ready-326CE5?logo=kubernetes&logoColor=white)](k8s/README.md)
[![License](https://img.shields.io/badge/license-UNLICENSED-lightgrey)](package.json)

An internal case-study catalogue with access-controlled client sharing, built for Digital Covet.

## Overview

Portfolio is a staff workspace and client-facing showcase. Staff catalogue published work,
classify it against a controlled business taxonomy, and create tokenised links that expose
selected studies to clients. Recipients open a branded portal, optionally pass a password,
and browse only the work the link admits.

The app is a stateless AdonisJS server that serves React pages through Inertia and hydrates
them in the browser. Authentication is delegated to Digital Covet ID (IAM); PostgreSQL and
object storage are hosted externally (Supabase).

## Features

- **Case-study catalogue** — Markdown content, hero image, sortable gallery, attachments,
  metrics, testimonials and videos. Studies move through `draft`, `published` and `archived`
  states, can be duplicated, and carry a stable folio number.
- **Share links** — Target work either by picking published studies or by live rules across
  sector, industry, key business, work category, service and client. Rules re-evaluate as new
  work is published.
- **Access controls** — Optional password, expiry date (inclusive, UTC), maximum view count,
  and revocation. Passwords are hashed; wrong guesses are limited per IP and share in Postgres.
- **Client portal** — Token-addressed gallery and study pages with responsive editorial layouts,
  password gate, expiry/limit states, and a signed-URL proxy for private files.
- **Engagement analytics** — Dashboard summaries, 30-day view series, per-share visits, unique
  visitors, device/browser breakdown and recent-visit audit rows.
- **Controlled vocabulary** — A Sector → Industry → Key Business hierarchy plus work categories,
  services, business models and clients. Library screens are restricted to admins.
- **IAM access** — OAuth 2.0 authorization code flow with PKCE. Roles (`employee`, `admin`,
  `superadmin`) are owned by IAM and mirrored into the local `app_user` table.
- **Operational readiness** — Public dependency-free health check, stateless cookies, container
  image, Kubernetes manifests, migration job and an orphan-upload prune command.

## Tech stack

| Layer | Choice |
|---|---|
| Server | AdonisJS 7, TypeScript, Lucid ORM |
| Frontend | Inertia 3, React 19, Tailwind CSS 4, Base UI, Lucide, Motion |
| Database | PostgreSQL (Supabase poolers), raw SQL migrations |
| Files | Supabase Object Storage (public and private buckets) |
| Auth | Digital Covet ID (IAM), OAuth 2.0 + PKCE |
| Tooling | Vite 8, Japa, ESLint, Prettier |
| Delivery | Podman/Docker image, Kustomize, Kubernetes |

## Requirements

- **Node.js ≥ 26.0.0** and **pnpm ≥ 12.0.0** (the image pins Node 26.13.0 and pnpm 12.17.0).
- **PostgreSQL** with the `citext` extension. Supabase is the intended provider:
  - `DATABASE_URL` — transaction-mode pooler for runtime queries.
  - `DIRECT_URL` — session-mode pooler for migrations and DDL.
- **Digital Covet ID OAuth client** for sign-in, with
  `<APP_URL>/auth/callback` registered as a redirect URI.
- **Supabase Object Storage** (optional for browsing, required for uploads and downloads):
  a private bucket for editor uploads. A public bucket is optional for directly linkable assets.
- **Podman** (or Docker) and **kubectl** only if you build/deploy containers.

## Installation

```bash
git clone git@github-work:Digital-Covet/portfolio.git
cd portfolio
pnpm install
cp .env.example .env
node ace generate:key
```

Fill in `.env` with the database, IAM and storage credentials described below.

Run migrations through the direct connection:

```bash
node ace migration:run --connection=postgres_direct
```

Optional demo data is idempotent. The order matters because case studies depend on the
taxonomy and seed clients:

```bash
node ace db:seed --connection=postgres_direct --files=./database/seeders/taxonomy_seeder.ts
node ace db:seed --connection=postgres_direct --files=./database/seeders/client_seeder.ts
node ace db:seed --connection=postgres_direct --files=./database/seeders/case_study_seeder.ts
```

Start the development server:

```bash
pnpm dev
```

Open <http://localhost:3333>. The root redirects to `/dashboard`; signed-out visitors are
sent to `/login` and then to IAM.

## Usage

### Staff workspace

| Route | Purpose |
|---|---|
| `/dashboard` | Catalogue health, share status, recent views and items needing attention |
| `/case-studies` | Browse and filter studies; create, edit, duplicate and archive |
| `/shares` | Share-link lifecycle list and creation |
| `/shares/:id` | Engagement, visits, device mix and link controls |
| `/clients`, `/taxonomies` | Admin-only controlled vocabulary screens |

### Client portal

Share URLs use an unguessable token:

```text
/s/:token              Gallery (or password gate)
/s/:token/:slug        One admitted case study
/s/:token/files/:id    Private-file proxy
```

A view is recorded once per browser session when the gallery or a study is first served.
Expiry, the view cap and the password gate are checked in that order on every request.
Recipients never see the view counter.

### Health check

`GET /health` is public, dependency-free and returns `{"status":"ok"}`. It is used by
container health checks and Kubernetes probes.

## Configuration

Runtime configuration is environment-only. Copy `.env.example` and fill in:

| Variable | Required | Notes |
|---|---|---|
| `APP_KEY` | Yes | Generate with `node ace generate:key`. Changing it invalidates sessions and encrypted OAuth state. |
| `APP_URL` | Yes | Public origin. Must match the IAM redirect URI `<APP_URL>/auth/callback`. |
| `DATABASE_URL` | Yes | Supabase transaction-mode pooler (port 6543) for runtime queries. |
| `DIRECT_URL` | Yes | Session-mode pooler (port 5432). Used by migrations and schema tests. |
| `IAM_URL` | Yes | Digital Covet ID base URL. |
| `IAM_CLIENT_ID` / `IAM_CLIENT_SECRET` | Yes | OAuth client credentials. |
| `SESSION_DRIVER` | Yes | `cookie` (default), `memory` or `database`. |
| `HOST` / `PORT` | Yes | Defaults are `localhost` and `3333`; containers use `0.0.0.0:3333`. |
| `LOG_LEVEL` | Yes | Pino level, for example `info`. |
| `SUPABASE_URL` | For storage | Supabase project URL. |
| `SUPABASE_SECRET_KEY` | For storage | Service key used by the storage client. |
| `STORAGE_BUCKET_PRIVATE` | For uploads | Bucket for editor uploads and private files. |
| `STORAGE_BUCKET_PUBLIC` | No | Reserved for publicly linkable assets. |
| `VITE_APP_NAME` | No | Build-time app name shown in the UI. |
| `VITE_IAM_ACCOUNT_URL` | No | Optional account-management link in the user menu. |

`VITE_*` values are inlined by Vite at build time, not read at runtime. When building the
container, pass them as build arguments (the `scripts/container.mjs` helper does this).

IAM must include `portfolio` in the user's `app_access` list and return a valid role:
`employee`, `admin` or `superadmin`.

## Development

```bash
pnpm dev          # serve with hot module replacement
pnpm test         # run Japa test suites
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm typecheck    # server + Inertia TypeScript projects
pnpm build        # production build into ./build
```

`pnpm build` emits a self-contained build directory. The production entrypoint is
`node bin/server.js` from that directory; the container uses it as its default command.

Tests live in `tests/unit`. The schema suite runs inside a transaction on `postgres_direct`
and rolls back, so it needs a reachable database. `.env.test` only overrides IAM credentials
and the session driver for the test environment.

Useful Ace commands:

```bash
node ace migration:run --connection=postgres_direct
node ace migration:rollback --connection=postgres_direct
node ace files:prune              # dry run: orphan uploads older than 24h
node ace files:prune --force      # delete them
```

## Project structure

```text
app/
  controllers/       HTTP handlers for dashboard, studies, shares, portal, uploads
  middleware/        auth, admin, guest, Inertia, robots
  models/            Lucid models and soft-delete helpers
  services/          IAM OAuth, user sync, share targeting, storage, dashboard, limits
  validators/        Vine schemas
commands/            ace commands (files:prune)
config/              AdonisJS configuration
database/            raw SQL migrations, generated schema classes, seeders
inertia/             React pages, layouts, components and client helpers
k8s/                 Kustomize base, jobs and local/production overlays
scripts/             Podman and Kubernetes deployment helpers
start/               routes, kernel, environment schema, Vine setup
tests/               Japa unit tests
resources/views/     Edge shell that mounts the Inertia app
```

The UI design rationale and visual system are documented in
[`portfolio-design-system.md`](portfolio-design-system.md).

## Deployment

The image is built with Podman and runs as a non-root user on port `3333`, with a read-only
root filesystem except for `tmp/`:

```bash
make image          # build ghcr.io/digitalcovet/portfolio-digital-covet:local
make run            # run locally with values from .env
make health         # run the image health check once
make logs
make stop
```

Kubernetes deployment uses an external Supabase database and object storage, a one-shot
migration Job and a stateless web Deployment:

```bash
make secret         # create/update the portfolio-env Secret from .env
make deploy         # migrate, apply the production overlay, roll the deployment
make migrate-only   # migrations only
make local-up       # kind cluster on Podman: build, migrate, deploy
make local-down
```

See [`k8s/README.md`](k8s/README.md) for required placeholders, the Secret keys, local
port-forwarding and operational notes. Migrations are additive by default; for a breaking
change, run `make migrate-only` before deploying code that depends on it.

## License

Proprietary and `UNLICENSED`. This repository is not licensed for redistribution.
