#!/usr/bin/env bash
# Local Kubernetes on rootless Podman, using kind.
#
#   ./scripts/k8s-local.sh up     build image, create/load kind cluster, deploy
#   ./scripts/k8s-local.sh down   delete the kind cluster
#
# Prerequisites: podman, kubectl and kind. Node 26 and pnpm are used to build.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

NAMESPACE="portfolio"
CLUSTER="${KIND_CLUSTER:-portfolio}"
IMAGE="${IMAGE:-ghcr.io/digitalcovet/portfolio-digital-covet:local}"
MIGRATE_JOB="portfolio-migrate"
MIGRATE_TIMEOUT="${MIGRATE_TIMEOUT:-300s}"
ROLLOUT_TIMEOUT="${ROLLOUT_TIMEOUT:-240s}"

# kind shells out to Podman instead of Docker.
export KIND_EXPERIMENTAL_PROVIDER=podman

usage() {
  sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'
}

require() {
  command -v "$1" >/dev/null || {
    echo "error: $1 is not installed" >&2
    if [ "$1" = "kind" ]; then
      echo "  install: go install sigs.k8s.io/kind@latest" >&2
      echo "  or:      https://kind.sigs.k8s.io/docs/user/quick-start/#installation" >&2
    fi
    exit 1
  }
}

down() {
  require kind
  kind delete cluster --name "$CLUSTER"
}

up() {
  require podman
  require kubectl
  require kind

  if ! kind get clusters | grep -qx "$CLUSTER"; then
    echo "Creating kind cluster ${CLUSTER} on Podman…"
    kind create cluster --name "$CLUSTER" --wait 120s
  fi

  kubectl config use-context "kind-${CLUSTER}" >/dev/null

  echo "Building ${IMAGE}"
  IMAGE="$IMAGE" node scripts/container.mjs build

  echo "Loading ${IMAGE} into ${CLUSTER}"
  kind load docker-image --name "$CLUSTER" "$IMAGE"

  kubectl create namespace "$NAMESPACE" --dry-run=client --output yaml | kubectl apply -f -

  node scripts/k8s-secret.mjs --namespace "$NAMESPACE"

  # The migration Job validates the env schema, so the ConfigMap must exist
  # before it starts.
  kubectl --namespace "$NAMESPACE" apply -f k8s/base/configmap.yaml

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

  kubectl apply -k k8s/overlays/local
  kubectl --namespace "$NAMESPACE" rollout restart deployment/portfolio
  kubectl --namespace "$NAMESPACE" rollout status deployment/portfolio --timeout="$ROLLOUT_TIMEOUT"

  echo
  echo "Pods:"
  kubectl --namespace "$NAMESPACE" get pods
  echo
  echo "Forward the service and open the app:"
  echo "  kubectl -n ${NAMESPACE} port-forward svc/portfolio 3333:80"
  echo "  http://localhost:3333/health"
  echo
  echo "Tear down with: ./scripts/k8s-local.sh down"
}

case "${1:-up}" in
  up) up ;;
  down) down ;;
  -h | --help | help) usage ;;
  *)
    echo "error: unknown command: $1" >&2
    usage >&2
    exit 1
    ;;
esac
