IMAGE ?= ghcr.io/digitalcovet/portfolio-digital-covet:local

.PHONY: image push run stop logs health secret deploy migrate-only local-up local-down

## build the production image
image:
	node scripts/container.mjs build

## push the image to its registry
push:
	node scripts/container.mjs push

## run the image locally with the values from .env
run:
	IMAGE=$(IMAGE) node scripts/container.mjs run

stop:
	node scripts/container.mjs stop

logs:
	node scripts/container.mjs logs

health:
	node scripts/container.mjs health

## create/update the portfolio-env Secret in the cluster
secret:
	node scripts/k8s-secret.mjs --namespace portfolio

## migrate, apply the production overlay and roll the deployment
deploy:
	./scripts/k8s-deploy.sh

## run migrations only
migrate-only:
	MIGRATE_ONLY=1 ./scripts/k8s-deploy.sh

## build, create a kind cluster on Podman and deploy the local overlay
local-up:
	./scripts/k8s-local.sh up

## delete the local kind cluster
local-down:
	./scripts/k8s-local.sh down
