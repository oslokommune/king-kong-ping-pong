.PHONY: help
SHELL = /bin/bash

NAME=`jq .name -r package.json`
VERSION=`jq .version -r package.json`
REPOSITORY=docker.pkg.github.com/oslokommune/king-kong-ping-pong

help: ## Print this menu
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

bump:
	npm version patch

build-image:
	docker build \
		--tag ${REPOSITORY}/${NAME}:${VERSION} \
		--tag ${REPOSITORY}/${NAME}:latest \
		.
push-image:
	docker push ${REPOSITORY}/${NAME}:${VERSION}
	docker push ${REPOSITORY}/${NAME}:latest
run-image:
	docker run --rm \
		--publish "3000:3000" \
		--env UPSTREAM_URL="http://localhost:3000" \
		--env SLACK_WEBHOOK_URL="detteerentesturl" \
		--env KONG_API_KEY="afancyapikeyslashtoken" \
		${REPOSITORY}/${NAME}:${VERSION}

release: bump build-image push-image ## Bump, build a docker image and push it to a repository
	@echo "🚀 Release is ready for deploy"

run: ## Run the service locally
	npx nodemon server.ts
