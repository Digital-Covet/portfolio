# Kubernetes manifests

One image, two workloads plus an opt-in cleanup Job: `Deployment` (web), a
one-shot `Job` (migrations) and a `CronJob` (orphan uploads). Postgres
(Supabase) and object storage stay external — there is no database pod here.
The app is stateless: cookie sessions, Postgres-backed share-unlock limits, and
uploads streamed to Supabase Object Storage.

```
base/                     Kustomize base (namespace, config, service, deployment, PDB)
jobs/migrate.yaml         node ace migration:run --connection=postgres_direct --force
jobs/files-prune-cronjob.yaml   opt-in orphan upload cleanup (not in the kustomization)
overlays/local/           kind on Podman: image tag `local`, 1 replica, port-forward
overlays/production/      ingress + TLS, 2 replicas, pinned image tag
```

## Image

Built from `Dockerfile` with Podman. The helper passes `--format docker` because
Podman's default OCI format drops `HEALTHCHECK`.

```bash
# local build (tag used by the kind overlay)
node scripts/container.mjs build

# registry build/push
export IMAGE=ghcr.io/digitalcovet/portfolio-digital-covet:$(git rev-parse --short HEAD)
node scripts/container.mjs build
podman login ghcr.io
node scripts/container.mjs push
```

The image pins Node 26.13.0 and pnpm 12.17.0, runs as UID 1000, listens on
`3333`, writes only to `tmp/`, and health-checks `GET /health`.

Run it standalone with the values from `.env` (the helper parses quotes the
same way AdonisJS does and starts the container read-only):

```bash
node scripts/container.mjs run
curl -fsS http://localhost:3333/health
node scripts/container.mjs logs
node scripts/container.mjs stop
```

`APP_URL` defaults to `http://localhost:3333` for local runs; pass
`APP_URL=https://…` to override it.

## 1. Configure

Edit the placeholders before deploying:

- `k8s/overlays/production/ingress.yaml` — host (`portfolio.example.com`) and
  the TLS secret; change the cert-manager `ClusterIssuer` if yours differs.
- `k8s/overlays/production/configmap-patch.yaml` — `APP_URL`, the public HTTPS
  origin. It must match the IAM OAuth client's registered redirect URI
  (`<APP_URL>/auth/callback`).
- `k8s/overlays/production/kustomization.yaml` — pin `newTag` to a git SHA.
- `k8s/jobs/files-prune-cronjob.yaml` — update the image tag if you enable it.

Non-secret runtime settings live in `k8s/base/configmap.yaml`
(`NODE_ENV`, `HOST`, `PORT`, `TZ`, `LOG_LEVEL`, `APP_NAME`, `SESSION_DRIVER`).

## 2. Create the Secret (never commit it)

`scripts/k8s-secret.mjs` reads `.env`, keeps the ConfigMap/build-time keys out,
and applies everything else as `portfolio-env`:

```bash
node scripts/k8s-secret.mjs --namespace portfolio
node scripts/k8s-secret.mjs --print   # inspect without applying
```

Required keys: `APP_KEY`, `DATABASE_URL` (transaction-mode pooler, runtime),
`DIRECT_URL` (session-mode pooler, migrations), `IAM_URL`, `IAM_CLIENT_ID`,
`IAM_CLIENT_SECRET`. Optional: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
`STORAGE_BUCKET_PUBLIC`, `STORAGE_BUCKET_PRIVATE`.

Changing `APP_KEY` signs everyone out and invalidates encrypted OAuth state.

## 3. Deploy (production overlay)

```bash
./scripts/k8s-deploy.sh
```

The script creates the namespace, refreshes the Secret, applies the ConfigMap,
runs the `portfolio-migrate` Job and waits for it, applies
`k8s/overlays/production`, then restarts and waits for the Deployment.
Migrations therefore finish before new pods roll. It assumes additive
migrations; for a breaking change run `MIGRATE_ONLY=1 ./scripts/k8s-deploy.sh`
first, then deploy once the new code is compatible.

`K8S_OVERLAY`, `MIGRATE_TIMEOUT` and `ROLLOUT_TIMEOUT` are configurable.

## Local cluster (kind on Podman)

Prerequisites: `podman`, `kubectl`, `kind`. kind shells out to Podman through
`KIND_EXPERIMENTAL_PROVIDER=podman`, which the script exports.

```bash
./scripts/k8s-local.sh up     # build image, create cluster, migrate, deploy
kubectl -n portfolio port-forward svc/portfolio 3333:80
open http://localhost:3333/health
./scripts/k8s-local.sh down   # delete the kind cluster
```

The local overlay uses the `:local` image loaded with `kind load docker-image`,
runs a single replica, and sets `APP_URL=http://localhost:3333`. The IAM OAuth
client must allow `http://localhost:3333/auth/callback` for sign-in to work
against a local IAM instance.

No ingress controller is required locally; port-forward reaches the Service
directly. To test the production overlay, install an ingress controller and
point `portfolio.example.com` at it.

## Notes

- **Probes**: `GET /health` is public and dependency-free (it does not touch
  Postgres or storage), so an outage never restarts a healthy pod. Startup,
  readiness and liveness all use it.
- **Proxy IPs**: `config/app.ts` sets `trustProxy: 'uniquelocal'`, so
  `request.ip()` records the real client address from `X-Forwarded-For`
  (ingress pods live on private ranges). Share view auditing and unlock limits
  depend on it.
- **Uploads**: the app accepts up to 20 MB; the ingress allows 25 MB. Bytes are
  staged in `tmp/` (an `emptyDir`) and forwarded to Supabase Object Storage, so
  no PVC is needed.
- **Scaling**: web replicas are stateless — raise `spec.replicas`. The unlock
  limiter uses an atomic Postgres upsert, and sessions are cookies.
- **Image pulls**: the manifests use `imagePullPolicy: IfNotPresent`, which is
  correct for immutable tags and for images loaded into kind. If the registry
  is private, create a pull secret and reference it from the Deployment.
- **Prune CronJob**: `files:prune` is a dry run unless `--force` is passed; the
  CronJob passes it. It is intentionally not in the kustomization. Do a dry run
  first with
  `kubectl -n portfolio exec deploy/portfolio -- node ace files:prune`.
- **tmp/**: mounted as an `emptyDir` (64 Mi). The root filesystem is read-only;
  nothing else is written to disk.
