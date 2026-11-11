#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

NAMESPACE="portfolio"
OVERLAY="${K8S_OVERLAY:-k8s/overlays/production}"
MIGRATE_JOB="portfolio-migrate"
MIGRATE_TIMEOUT="${MIGRATE_TIMEOUT:-300s}"
ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-240s}"

command -v kubectl >/dev/null || {
  echo "error: kubectl is not installed" >&2
  exit 1
}

kubectl create namespace "$NAMESPACE" --dry-run=client --output yaml | kubectl apply -f -

node scripts/k8s-secret.mjs --namespace "$NAMESPACE"

# `node ace` validates the full env schema, so the Job needs the ConfigMap even
# though it only talks to Postgres. Apply it before the migration runs.
kubectl --namespace "$NAMESPACE" apply -f k8s/base/configmap.yaml

IMAGE="${IMAGE:-$(kubectl kustomize "$OVERLAY" | awk '/^[[:space:]]*image:/ { print $NF; exit }')}"
if [ -z "$IMAGE" ]; then
  echo "error: could not determine the image from $OVERLAY" >&2
  exit 1
fi

echo "Migrating ${NAMESPACE} with ${IMAGE}"

kubectl --namespace "$NAMESPACE" delete job "$MIGRATE_JOB" --ignore-not-found

sed "s|__IMAGE__|${IMAGE}|g" k8s/jobs/migrate.yaml |
  kubectl --namespace "$NAMESPACE" apply -f -

if ! kubectl --namespace "$NAMESPACE" wait \
  --for=condition=complete "job/$MIGRATE_JOB" --timeout="$MIGRATE_TIMEOUT"; then
  echo "error: migration job failed, last logs:" >&2
  kubectl --namespace "$NAMESPACE" logs "job/$MIGRATE_JOB" \
    --all-containers --tail=100 >&2 || true
  exit 1
fi

if [ "${MIGRATE_ONLY:-0}" = "1" ]; then
  echo "Migrations complete (MIGRATE_ONLY=1)"
  exit 0
fi

kubectl apply -k "$OVERLAY"

# Env changes (ConfigMap/Secret) do not restart pods on their own, so roll the
# Deployment explicitly to make sure every replica picks up the new values.
kubectl --namespace "$NAMESPACE" rollout restart deployment/portfolio
kubectl --namespace "$NAMESPACE" rollout status deployment/portfolio --timeout="$ROLLOUT_TIMEOUT"

kubectl --namespace "$NAMESPACE" get ingress || true
